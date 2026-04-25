interface BilingualMenuNameProps {
  name: string;
  containerClassName?: string;
  frenchClassName?: string;
  arabicClassName?: string;
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function splitMenuName(name: string) {
  const parts = name.split(' - ');
  if (parts.length < 2) {
    return {
      french: name,
      arabic: null as string | null
    };
  }

  const arabic = parts[0].trim();
  const french = parts.slice(1).join(' - ').trim();

  if (!/[\u0600-\u06FF]/.test(arabic)) {
    return {
      french: name,
      arabic: null as string | null
    };
  }

  return {
    french,
    arabic
  };
}

export function BilingualMenuName({
  name,
  containerClassName,
  frenchClassName,
  arabicClassName
}: BilingualMenuNameProps) {
  const { french, arabic } = splitMenuName(name);

  if (!arabic) {
    return <span className={frenchClassName}>{name}</span>;
  }

  return (
    <div className={joinClasses('flex items-start justify-between gap-3', containerClassName)}>
      <span className={joinClasses('min-w-0 flex-1 text-left', frenchClassName)}>{french}</span>
      <span
        dir="rtl"
        className={joinClasses('font-arabic min-w-0 flex-1 text-right leading-relaxed', arabicClassName ?? frenchClassName)}
      >
        {arabic}
      </span>
    </div>
  );
}
