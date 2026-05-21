interface ConfidenceTagProps {
  confidence: number | null;
}

export default function ConfidenceTag({ confidence }: ConfidenceTagProps) {
  if (confidence === null) return null;

  if (confidence >= 0.7) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
        ✓ {Math.round(confidence * 100)}%
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium animate-pulse">
      ⚠ {Math.round(confidence * 100)}% — needs review
    </span>
  );
}
