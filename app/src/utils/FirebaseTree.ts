import {
  Firestore,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

import { Field } from 'o1js';

export default class FirebaseStore {
  private nodes: Record<number, Record<string, Field>> = {};
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Returns a node which lives at a given index and level.
   * @param level Level of the node.
   * @param index Index of the node.
   * @returns The data of the node.
   */
  async getNode(level: number, index: bigint, _default: Field): Promise<Field> {
    const node = await getDoc(
      doc(this.db, `tree/${level}:${index.toString()}`)
    );

    if (node.exists()) {
      return Field.from(node.get('data'));
    }

    return _default;
  }

  // TODO: this allows to set a node at an index larger than the size. OK?
  async setNode(level: number, index: bigint, value: Field) {
    await setDoc(doc(this.db, `tree/${level}:${index.toString()}`), {
      data: value.toString(),
    });

    return ((this.nodes[level] ??= {})[index.toString()] = value);
  }
}
