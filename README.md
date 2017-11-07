Context is currently used for three different purposes, which is problematic:

  1. Real context that's carried across the entire conversation.
  2. As options that are passed to the next `AnswerProcessor`.
  3. As ephemeral state for things like validation errors within a single answer-processor.

Additionally, context is passed via a side-channel rather than within the data structure, which creates further problems.

What the types might look like if context were made a part of the data structure:

```
type Conversation = Array<QA | Promise<QA>>;
type QA = {
  question: String
  answer: Array<String>
  context: Object // addresses context use-case #1
  submitAnswer: AnswerProcessor
};
type AnswerProcessor = (conversation, action) => Promise<conversation>;
type AnswerProcessorFactory (options: Object) => AnswerProcessor; // addresses context use-case #2
```

This still isn't ideal since:

  1. Our data structures aren't classical data structures since they contain code (e.g. promises and function pointers) which makes things like undo harder to implement.
  2. The data structure isn't very sound since we have an `Array` type where the final value in the array can be slightly different.

Taking these additional points into consideration we might end up with something like this:

```
type Conversation = {
  nextQuestion: UnansweredQuestion | null
  answeredQuestions: Array<AnsweredQuestion>
};

type UnansweredQuestion = {
  question: String,
  conversationContext: Object, // addresses context use-case #1
  answerProcessorName: String,
  answerProcessorOptions: Object, // addresses context use-case #2
  answerProcessorContext: Object // addresses context use-case #3
};

type AnsweredQuestion = {
  question: UnansweredQuestion,
  answer: Answer
};

type Answer = Array<String>;

type AnswerProcessor = (conversation: Conversation, answer: Answer) => Promise<Conversation>;
```

Some things to note:

  1. We've separately catered for all three uses of context in a more structured way.
  2. Our data structures are free of functions -- `answerProcessorName` is used instead of a function pointer, and `answerProcessorOptions` and `answerProcessorContext` contain the data that would be sent to the factory that produced the function pointer, so we can now undo or redo with ease.
  3. Our data structures are free of promises -- `AnswerProcessor` has a single promise which is enough to cater for both asynchronous question retrieval and answer validation since these actions occur in sequence, and the outcomes of both only affect the new state of the conversation.
