const create = (baId, now = new Date()) =>{
    const date = now.getUTCDate()
    const weekDay = now.getUTCDay() + 1

    const modeWeekDay = (date % weekDay) + 1 
    const hash = baId.toString('')
        .split("")
        .map(c => parseInt(c) % modeWeekDay)
        .join("")

    return `${hash}${weekDay}${date}`
}

const validate = (baId, token) =>{
    const now = new Date()
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tormorrow = new Date()
    tormorrow.setDate(tormorrow.getDate() + 1)

    const validList = [
        create(baId, now),
        create(baId, yesterday),
        create(baId, tormorrow),
    ]

    return validList.includes(token)
}

module.exports = {
    create,
    validate
}