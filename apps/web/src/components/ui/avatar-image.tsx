import { useEffect, useState, type ImgHTMLAttributes } from "react";

export default function AvatarImage({
  src,
  alt = "",
  priority,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed)
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`avatar-fallback ${props.className || ""}`}
        style={{ width: props.width, height: props.height }}
      >
        {alt.charAt(0).toUpperCase() || "Z"}
      </span>
    );
  return (
    <img
      {...props}
      key={src}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}
