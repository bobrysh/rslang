/*const userExample = {
    "email": "string3242424@dfgdg.dg",
    "password": "ASD324sdfs3@$@",
    "userId": "5eea492edffad00017faa81c",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlZWE0OTJlZGZmYWQwMDAxN2ZhYTgxYyIsImlhdCI6MTU5MjUxMjU4NSwiZXhwIjoxNTkyNTI2OTg1fQ.CzGcz5F8sMod2gEQhn4RfIym574z0DZyLRfflqKpyeA",
}*/

export const userSettings = {
  auth: {
    email: null,
    password: null,
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
  },
  learning: {
    wordsPerDay: 150,
    cardsPerDay: 150,
    withTranslation: true,
    withExplanation: false,
    withExample: false,
    withTranscription: true,
    withHelpImage: false,
    deleteWord: true,
    hardWord: false,
    showAnswerButton: false,
    autoplay: false,
    repeatButton: false,
    hardButton: false,
    goodButton: false,
    liteButton: false
  },
  // ...userExample,
};
