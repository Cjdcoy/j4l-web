type Props = {
  name?: string;
  className?: string;
};

const cod2Colors: Record<string, string> = {
  "1": "#da0120",
  "2": "#00b906",
  "3": "#e8ff19",
  "4": "#170bdb",
  "5": "#23c2c6",
  "6": "#e201db",
  "7": "#eee",
  "8": "#8080FE",
  "9": "#757575",
  "0": "#000",
};

export function ColoredPlayerName({ name = "Unknown Player", className }: Props) {
  const normalizedName = normalizeColorCodes(name);
  const parts = normalizedName.split(/\^(?=\d)/);
  const colorNumbers = parts.slice(1).map((part) => part.charAt(0));

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (index === 0 || !colorNumbers[index - 1]) {
          return part;
        }

        const color = cod2Colors[colorNumbers[index - 1]];
        const text = part.slice(1);

        return (
          <span style={color ? { color } : undefined} key={`${index}-${text}`}>
            {text}
          </span>
        );
      })}
    </span>
  );
}

export function stripColorCodes(name = "") {
  return normalizeColorCodes(name).replace(/\^[0-9]/g, "");
}

function normalizeColorCodes(name: string) {
  return name
    .replace(/\^\^([0-9])\1/g, "^$1")
    .replace(/\^\^([0-9])/g, "^$1");
}
