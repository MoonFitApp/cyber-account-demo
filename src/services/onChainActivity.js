const {ONCHAIN_ACTIVITY} = require("../constants/onchain-activity")
const MoonFitActivities = require('../abis/MoonFitActivities.json')
const Web3 = require('web3')
const web3 = new Web3('https://goerli.base.org')

const moonfitActivitiesContract = () => {
    return new web3.eth.Contract(MoonFitActivities, '0xE9845334e513Fdb76D45aEa129279597d6E6A8Ff')
}

const getDataTx = async (data) => {
    const contract = moonfitActivitiesContract()

    const pushRunningEvent = async () => {
        const {
            distance,
            distanceUnit,
            earning,
            durationInSec,
            kcalBurned,
            MoonBeast,
            activityType,
            startTime,
            endTime,
        } = data


        const _earning = web3.utils.toWei(earning.toString(), 'ether')

        return contract.methods.finishRunning(distance, distanceUnit, _earning, durationInSec, kcalBurned, MoonBeast, activityType, startTime, endTime)

    }
    const pushLuckyWheelEvent = async () => {
        const {reward, timeSpin} = data

        return contract.methods.spinLuckyWheel(reward, timeSpin)

    }
    const pushDailyTaskEvent = async () => {
        const {rewards, timeClaim, taskName} = data

        return contract.methods.completeDailyTask(rewards, timeClaim, taskName)

    }
    try {
        switch (data.type) {
            case ONCHAIN_ACTIVITY.TYPE.RUNNING:
                return pushRunningEvent()
            case ONCHAIN_ACTIVITY.TYPE.DAILY_TASK:
                return pushDailyTaskEvent()
            case ONCHAIN_ACTIVITY.TYPE.LUCKY_WHEEL:
                return pushLuckyWheelEvent()
            default:
                return ''
        }
    } catch (e) {
        return ''
    }

}


module.exports = {
    getDataTx,
}

