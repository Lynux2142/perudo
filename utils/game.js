class User {
	constructor(username, nbDice, diceList, isReady) {
		this.username = username;
		this.nbDice = nbDice;
		this.diceList = diceList;
		this.isReady = isReady;
	}
	giveDice() {
		for (var i = 0; i < this.nbDice; ++i) {
			this.diceList.push(rollDice());
		}
	}
}

function isAllReady(users) {
	for (user in users) {
		console.log(`${user}: ${users[user].isReady}`)
		if (users[user].isReady !== true) {
			return false;
		}
	}
	return true;
}

function rollDice() {
	return (Math.floor(Math.random() * Math.floor(6) + 1));
}

module.exports = { User, isAllReady}
