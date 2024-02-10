export type CommonHeader = {
  /**
   * Header version to avoid parsing incompatible headers.
   */
  version: number;
  /**
   * An identifier that is persistent even as versions of the data change. Safe to use as a file path.
   */
  persistentId: string;
  /**
   * A unique identifier for the data to be read. Safe to use as a file path.
   */
  uniqueId: string;
  /**
   * Specifies whether the data to be read is a utf8-encoded string or raw binary data. This was added
   * because node's `fs.readFileSync` returns garbage when reading string files without specifying the encoding.
   */
  dataType: 'string' | 'bytes';
};

export type StepKeyHeader<Kind> = {
  kind: Kind;
  programName: string;
  methodName: string;
  methodIndex: number;
  hash: string;
};

export type WrapKeyHeader<Kind> = {
  kind: Kind;
  programName: string;
  hash: string;
};

export type CacheHeader = (
  | StepKeyHeader<'step-pk'>
  | StepKeyHeader<'step-vk'>
  | WrapKeyHeader<'wrap-pk'>
  | WrapKeyHeader<'wrap-vk'>
) &
  CommonHeader;

export type MinaCache = {
  /**
   * Read a value from the cache.
   *
   * @param header A small header to identify what is read from the cache.
   */
  read(header: CacheHeader): Uint8Array | undefined;
  /**
   * Write a value to the cache.
   *
   * @param header A small header to identify what is written to the cache. This will be used by `read()` to retrieve the data.
   * @param value The value to write to the cache, as a byte array.
   */
  write(header: CacheHeader, value: Uint8Array): void;
  /**
   * Indicates whether the cache is writable.
   */
  canWrite: boolean;
};
