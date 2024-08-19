import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const Message = ({ content, time, type, ...data }) => {
    return <div className={`flex ` + (type == 's' ? 'justify-end' : '')}>
        <div className='mx-4 py-1 px-2 rounded bg-slate-300 text-neutral-600 max-w-[60%]'>
            <pre className='me-4 whitespace-pre-wrap'>
                {content}
                {
                    data.messageType == 'radio' && <>
                        <input type="hidden" name='question' value={content} />
                        {
                            Object.entries(data.options).map(([key, value], index) => (
                                <div key={index} className='ms-4'>
                                    <input type='radio' name={`answer`} value={value} id={data.id + key} required /> <label htmlFor={data.id + key}>{value}</label>
                                </div>
                            ))
                        }
                        <div className='flex justify-end'>
                            <button type="submit" className='bg-slate-500 px-4 py-1 rounded text-white' name='submit'>Save</button>
                        </div>
                    </>
                }
            </pre>
            <div className='text-sm flex justify-end text-neutral-500'>
                {time.toLocaleTimeString()}
            </div>
        </div>
    </div>
}

const App = () => {
    const socket = useRef()

    const [messages, setMessages] = useState([])

    const connect = () => {
        socket.current = io('http://localhost:8000')

        socket.current.on('connect', () => {
            console.log('connected')
        })

        socket.current.on('message', (data) => {
            const { time, ...extra } = JSON.parse(data)
            setMessages(preMessages => [...preMessages, {
                type: 'r',
                time: new Date(time),
                ...extra
            }])
        })

    }

    useEffect(() => {
        if (socket.current)
            return
        connect()
    }, [])

    const sendMessage = (e) => {
        const form = e.target
        const message = form.message ? form.message.value : `question: ${form.question.value}\nanswer: ${form.answer.value}`

        if (message.length == 0)
            return

        const time = new Date()

        setMessages(preMessages => [...preMessages, {
            type: 's',
            content: message,
            time: time
        }])


        socket.current && socket.current.emit('message', JSON.stringify({
            content: message,
            time
        }))

        if (form.message)
            form.message.value = ''
        else {
            form.submit.hidden = true
        }
    }

    return (
        <div className='bg-neutral-600 text-white h-full'>
            <div className="container mx-auto py-24 flex flex-col h-full">
                <div className='border-4 border-dashed p-2 border-orange-400 rounded flex-1 flex flex-col h-full'>
                    <h1 className='text-2xl pb-2 flex justify-center text-green-300'>Health Bot</h1>
                    <div className='flex flex-col flex-1 gap-4 relative overflow-y-auto'>
                        {
                            messages.map((message, i) => (
                                <form key={i} onSubmit={(e) => {
                                    e.preventDefault()
                                    sendMessage(e)
                                }}>
                                    <Message {...message} />
                                </form>
                            ))
                        }
                    </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(e) }}>
                    <div className='border-x-4 border-b-4 border-dashed border-orange-400 rounded flex'>
                        <input name='message' type="text" className='flex-1 px-2 py-1 outline-none bg-neutral-700 text-lg' autoFocus />
                        <button type='submit' className='bg-orange-400 p-2 outline-none active:bg-orange-300'><img src="/send.png" alt="Send" className='invert' /></button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default App