class User {
	constructor(id, username, nbDice, diceList, isReady) {
		this.id = id;
		this.username = username;
		this.nbDice = nbDice;
		this.diceList = diceList;
		this.isReady = isReady;
	}
	giveDice() {
		this.diceList = [];
		for (var i = 0; i < this.nbDice; ++i) {
			this.diceList.push(rollDice());
		}
	}
}

function isAllReady(users) {
	const result = users.find(user => user.isReady === false);
	return (result) ? false : true;
}

function rollDice() {
	return (Math.floor(Math.random() * Math.floor(6) + 1));
}

function getUser(users, id) {
	return users.find(user => user.id === id);
}

module.exports = { User, isAllReady, getUser }
