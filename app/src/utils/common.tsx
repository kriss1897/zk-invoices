export function ShortAddress({
  address,
  length = 3,
}: {
  address: string;
  length?: number;
}) {
  return (
    <p>
      {address.slice(0, length)}...{address.slice(address.length - length)}
    </p>
  );
}
