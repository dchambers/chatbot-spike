// @flow

type Conversation = {
  nextQuestion: ?UnansweredQuestion,
  answeredQuestions: Array<AnsweredQuestion>
}

type UnansweredQuestion = {|
  question: Question,
  conversationContext: Object, // addresses context use-case #1
  answerProcessorName: string,
  answerProcessorOptions: Object, // addresses context use-case #2
  answerProcessorContext: Object // addresses context use-case #3
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

const chatbot: ChatbotFactory = (answerProcessors, initialQuestion) => {
  const bot: Chatbot = {
    conversation: {
      nextQuestion: initialQuestion,
      answeredQuestions: []
    },
    answer: async answerValue => {
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

const question = (question, answerProcessorName) => ({
  question,
  conversationContext: {},
  answerProcessorName,
  answerProcessorOptions: {},
  answerProcessorContext: {}
})

const nameQuestion = question('What is your name?', 'name-processor')
const nameProcessor: AnswerProcessor = (conversation, answer) => {
  if (!conversation.nextQuestion) {
    throw new Error('Answer processor invoked on completed conversation')
  }

  return Promise.resolve({
    nextQuestion: ageQuestion,
    answeredQuestions: [
      ...conversation.answeredQuestions,
      { question: conversation.nextQuestion, answer }
    ]
  })
}

const ageQuestion = question('How old are you?', 'age-processor')
const ageProcessor = (conversation, answer) =>
  Promise.resolve({
    nextQuestion: null,
    answeredQuestions: [
      ...conversation.answeredQuestions,
      { question: conversation.nextQuestion, answer }
    ]
  })

it('allows chatbots to be created with no answer processors', () => {
  const bot = chatbot({}, nameQuestion)
  expect(bot.conversation).toEqual({
    nextQuestion: nameQuestion,
    answeredQuestions: []
  })
})

it('uses the answer processors to answer the questions', () => {
  const answerProcessors = {
    'name-processor': nameProcessor
  }
  const bot = chatbot(answerProcessors, nameQuestion)
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
