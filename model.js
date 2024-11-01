"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = exports.Chair = exports.Player = exports.Deck = exports.Card = exports.Suits = void 0;
var Suits;
(function (Suits) {
    Suits[Suits["King"] = 0] = "King";
    Suits[Suits["Queen"] = 1] = "Queen";
    Suits[Suits["Ace"] = 2] = "Ace";
    Suits[Suits["Joker"] = 3] = "Joker";
})(Suits || (exports.Suits = Suits = {}));
class Card {
    constructor(suit) {
        this.suit = suit;
    }
    static cardType() {
        const randomSuitIndex = Math.floor(Math.random() * 3);
        return new Card(randomSuitIndex);
    }
    static dealCardsToPlayers() {
        const deck = Deck.Default();
        const hands = [];
        const hand = [];
        for (let i = 0; i < 5; i++) {
            hand.push(deck.nextCard());
        }
        hands.push(hand);
        return hands;
    }
}
exports.Card = Card;
class Deck {
    constructor() {
        this._cards = [];
    }
    static Default() {
        const deck = new Deck();
        for (let rank = 0; rank < 6; rank++) {
            for (let suit = 0; suit < 3; suit++) {
                deck._cards.push(new Card(suit));
            }
        }
        deck._cards.push(new Card(3));
        deck._cards.push(new Card(3));
        deck.Shuffle();
        return deck;
    }
    static WithCards(cards) {
        const deck = new Deck();
        deck._cards = cards;
        return deck;
    }
    get cards() {
        return this._cards;
    }
    ;
    nextCard() {
        const card = this._cards.pop();
        if (!card)
            throw "Out of Cards";
        return card;
    }
    Shuffle() {
        this._cards = this._cards
            .map((val) => ({ val, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ val }) => val);
    }
}
exports.Deck = Deck;
class Player {
    constructor(id, name, alive) {
        this.hand = Card.dealCardsToPlayers();
        this.alive = true;
        this.id = id;
        this.name = name;
        this.alive = alive;
    }
}
exports.Player = Player;
class Chair {
    sit(player) {
        this._player = player;
    }
    stand() {
        this._player = undefined;
    }
    get player() {
        return this._player;
    }
    ;
}
exports.Chair = Chair;
class Room {
    constructor() {
        this.id = Math.random().toString(36).substring(2, 6);
        this.gameStarted = false;
        this.chairs = [new Chair(), new Chair(), new Chair(), new Chair()];
        this.deck = Deck.Default();
        this.selectedCardType = Card.cardType();
    }
}
exports.Room = Room;
