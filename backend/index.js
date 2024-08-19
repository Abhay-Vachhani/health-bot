const { Server } = require("socket.io")

GEMINI_API_KEY = 'YOUR API KEY'

const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } })

const io = new Server({
    cors: '*'
})

const stringify = (data) => {
    return JSON.stringify(data)
}

const parse = (data) => {
    return JSON.parse(data)
}

io.on("connection", async (socket) => {
    const nanoid = (await import('nanoid')).nanoid

    console.log('Connected', socket.id)
    socket.emit('message', stringify({
        id: nanoid(),
        content: 'Hello, How can I help you?',
        messageType: 'text',
        time: new Date()
    }))

    socket.emit('message', stringify({
        id: nanoid(),
        content: 'Let\'s test your health',
        messageType: 'text',
        time: new Date()
    }))

    const chat = model.startChat()
    const result = await chat.sendMessage(`
        I want to test my health so for that give me a question in below format.
        Instructions:
            - Your name is 'Health Bot' created by Abhay Vachhani
            - messageType can be text, radio
            - If messageType is 'text' then key options are removed
            - when you get enough data tell the user that how its health in a text
            - You can use text type to send normal message and need content key
            - Also you can ask a text based question
            - You will just provide an information related to a health
            - You can use emojis and other options
            - Here you will act as a expert doctor

        
        Response: {
            "content": "A question in string format",
            "options": {"key": "option value"},
            "messageType": "radio"
        }
    `)

    try {
        const reply = result.response.text()

        socket.emit('message', stringify({
            id: nanoid(),
            time: new Date(),
            ...parse(reply)
        }))
    } catch { }


    socket.on('disconnect', () => {
        console.log('Disconnected', socket.id)
    })

    socket.on('message', async (data) => {
        const { content, time } = parse(data)

        const result = await chat.sendMessage(content)

        try {
            const reply = result.response.text()

            socket.emit('message', stringify({
                id: nanoid(),
                time: new Date(),
                ...parse(reply)
            }))
        } catch { }
    })
})

io.listen(8000)