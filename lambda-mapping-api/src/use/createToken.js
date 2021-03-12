module.exports.createToken = (baId, now = new Date()) => {
    const date = now.getUTCDate()
    const weekDay = now.getUTCDay() + 1
    const modeWeekDay = (date % weekDay) + 1
    const hash = baId.toString()
        .split("")
        .map(c => parseInt(c) % modeWeekDay)
        .join("")
    return `${hash}${weekDay}${date}`
}