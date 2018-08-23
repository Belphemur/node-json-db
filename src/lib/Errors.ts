export abstract class NestedError extends Error {
    readonly inner: Error
    readonly id: Number


    protected constructor(message: string, inner: Error, id: Number) {
        super(message)
        this.inner = inner
        this.id = id
    }


    toString(): string {
        const string = this.name + ": " + this.message
        if (this.inner) {
            return string + ':\n' + this.inner
        }
        return string
    }
}

export class DatabaseError extends NestedError {}

export class DataError extends NestedError {}