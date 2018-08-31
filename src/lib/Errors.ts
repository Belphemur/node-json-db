export abstract class NestedError extends Error {
    readonly inner?: Error
    readonly id: Number


    public constructor(message: string, id: Number, inner?: Error) {
        super(message)
        this.inner = inner
        this.id = id
        this.name = this.constructor.name
    }


    toString(): string {
        const string = this.name + ": " + this.message
        if (this.inner) {
            return string + ':\n' + this.inner
        }
        return string
    }
}

export class DatabaseError extends NestedError {
}

export class DataError extends NestedError {
}