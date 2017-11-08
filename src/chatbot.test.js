// @flow

type Conversation = {
  nextQuestion: ?UnansweredQuestion,
  answeredQuestions: Array<AnsweredQuestion>
}

type UnansweredQuestion = {|
  question: Question,
  conversationContext: Object, // addresses context use-case #1
  answerProcessorName: string,
  answerProcessorOptions: Object // addresses context use-case #2
|}

type AnsweredQuestion = {
  question: UnansweredQuestion,
  answer: Answer
}

type Question = string

type Answer = string

type AnswerProcessor = (
  conversation: Conversation,
  answer: Answer
) => Promise<Conversation>

// additional types for `chatbot`:

type AnswerProcessors = { [string]: AnswerProcessor }

type ChatbotFactory = (
  answerProcessors: AnswerProcessors,
  initialQuestion: UnansweredQuestion
) => Chatbot

type Chatbot = {
  conversation: Conversation,
  answer: (answer: Answer) => Promise<boolean>
}

const chatbot: ChatbotFactory = (
  answerProcessors,
  initialQuestion,
  answerProcessorOptions
) => {
  const bot: Chatbot = {
    conversation: {
      nextQuestion: initialQuestion,
      answeredQuestions: [],
      answerProcessorOptions
    },
    answer: async answerValue => {
      if (!bot.conversation.nextQuestion) {
        throw new Error('answer method invoked on completed conversation')
      }

      const processorName = bot.conversation.nextQuestion.answerProcessorName
      const answerProcessor = answerProcessors[processorName]
      const updatedConversation = await answerProcessor(
        bot.conversation,
        answerValue
      )
      bot.conversation = updatedConversation

      return true
    }
  }

  return bot
}

// tests

const question = (
  question,
  answerProcessorName,
  answerProcessorOptions = {}
) => ({
  question,
  conversationContext: {},
  answerProcessorName,
  answerProcessorOptions
})

const nameQuestion = question('What is your name?', 'name-processor', {})
const nameProcessor: AnswerProcessor = (conversation, answer) => {
  if (!conversation.nextQuestion) {
    throw new Error('Answer processor invoked on completed conversation')
  }

  const {
    nextQuestion: { conversationContext, answerProcessorOptions }
  } = conversation

  return Promise.resolve({
    nextQuestion: answerProcessorOptions.nextQuestion || ageQuestion,
    answeredQuestions: [
      ...conversation.answeredQuestions,
      { question: conversation.nextQuestion, answer }
    ]
  })
}

const optionedNameQuestion = answerProcessorOptions =>
  question('What is your name?', 'name-processor', answerProcessorOptions)

const ageQuestion = question('How old are you?', 'age-processor')
const locationQuestion = question('Where do you live?', 'location-processor')

const minimalAnswerProcessors = {
  'name-processor': nameProcessor
}

it('allows chatbots to be created with no answer processors', () => {
  const bot = chatbot({}, nameQuestion)
  expect(bot.conversation).toEqual({
    nextQuestion: nameQuestion,
    answeredQuestions: []
  })
})

it('uses the answer processors to answer the questions', () => {
  const bot = chatbot(minimalAnswerProcessors, nameQuestion)
  return bot.answer('Marvin').then(() => {
    expect(bot.conversation).toEqual({
      nextQuestion: ageQuestion,
      answeredQuestions: [
        {
          question: nameQuestion,
          answer: 'Marvin'
        }
      ]
    })
  })
})

it.skip(
  'allows answer processors to asynchronously validate answers before updating conversation'
)
it.skip(
  'allows answer processors to asynchronously generate next question for conversation'
)

it('allows answer processors to vary their behaviour based on passed options', () => {
  const initialQuestion = optionedNameQuestion({
    nextQuestion: locationQuestion
  })
  const bot = chatbot(minimalAnswerProcessors, initialQuestion)
  return bot.answer('Marvin').then(() => {
    expect(bot.conversation).toEqual({
      nextQuestion: locationQuestion,
      answeredQuestions: [
        {
          question: initialQuestion,
          answer: 'Marvin'
        }
      ]
    })
  })
})

it.skip(
  'allows answer processors to provide context for the remaining conversation'
)

it.skip('allows answer processors to vary their behaviour based on context')
