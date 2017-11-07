// @flow

type Conversation = {
  nextQuestion: UnansweredQuestion,
  answeredQuestions: Array<AnsweredQuestion>
}

type UnansweredQuestion = {
  question: string,
  conversationContext: Object, // addresses context use-case #1
  answerProcessorName: string,
  answerProcessorOptions: Object, // addresses context use-case #2
  answerProcessorContext: Object // addresses context use-case #3
} | null

type AnsweredQuestion = {
  question: UnansweredQuestion,
  answer: Answer
}

type Answer = Array<string>

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
  answer: (answer: Answer) => void
}

const chatbot: ChatbotFactory = (answerProcessors, initialQuestion) => ({
  conversation: {
    nextQuestion: initialQuestion,
    answeredQuestions: []
  },
  answer: () => {
    // TODO...
  }
})

// tests

it('allows chatbots to be created with no answer processors or an initial question', () => {
  const bot = chatbot({}, null)
  expect(bot.conversation).toEqual({
    nextQuestion: null,
    answeredQuestions: []
  })
})
