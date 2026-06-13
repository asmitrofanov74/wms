export abstract class ValueObject {
  public equals(other: this): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return JSON.stringify(this) === JSON.stringify(other);
  }
}
