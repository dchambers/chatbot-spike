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

export type AnswerProcessor = (
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

export default chatbot
