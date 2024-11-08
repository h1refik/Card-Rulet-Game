export enum Suits {
    King,
    Queen,
    Ace,
    Joker
}

export class Card {
    suit: Suits;

    constructor(suit: Suits) {
        this.suit = suit;
    }

    public static cardType(): Card {
        const randomSuitIndex = Math.floor(Math.random() * 3);
        return new Card(randomSuitIndex as Suits);
    }


    public static dealCardsToPlayers(): Card[] {
        const deck = Deck.Default();
        const hands: Card[] = [];

        for (let i = 0; i < 5; i++) {
            hands.push(deck.nextCard());
        }

        return hands;
    }
}

export class Deck {

    private constructor() { }

    public static Default(): Deck {
        const deck = new Deck();
        for (let rank = 0; rank < 6; rank++) {
            for (let suit = 0; suit < 3; suit++) {
                deck._cards.push(new Card(suit))
            }
        }
        deck._cards.push(new Card(3))
        deck._cards.push(new Card(3))
        deck.Shuffle();
        return deck;
    }

    public static WithCards(cards: Card[]): Deck {
        const deck = new Deck();
        deck._cards = cards;
        return deck;
    }


    private _cards: Card[] = [];
    public get cards(): Card[] {
        return this._cards
    };
    public nextCard(): Card {
        console.log(this._cards)
        const card = this._cards.pop();
        if (!card) throw "Out of Cards";
        return card;
    }

    public Shuffle(): void {
        this._cards = this._cards
            .map((val) => ({ val, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ val }) => val);

    }
}

export class Player {
    id: string;
    name: string;
    hand: Card[] = Card.dealCardsToPlayers();
    alive: boolean = true;

    constructor(id: string, name: string, alive: boolean) {
        this.id = id;
        this.name = name;
        this.alive = alive;
    }
}

export class Chair {
    private _player: Player | undefined;

    public sit(player: Player) {
        this._player = player;
    }

    public stand(): void {
        this._player = undefined;
    }
    public get player(): Player | undefined {
        return this._player
    };
}


export class Room {
    id: string = Math.random().toString(36).substring(2, 6);
    gameStarted: boolean = false;
    chairs: Chair[] = [new Chair(), new Chair(), new Chair(), new Chair()];
    deck: Deck = Deck.Default();
    selectedCardType: Card = Card.cardType();
    currentTurn: Player | undefined;
}
