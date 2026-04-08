interface PricingCardProps {
  title: string;
  items?: { size: string; price: string }[];
  note?: string;
  highlight?: boolean;
}

export function PricingCard({
  title,
  items,
  note,
  highlight = false,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-2xl p-8 ${
        highlight
          ? "bg-charcoal text-white ring-2 ring-charcoal"
          : "bg-white ring-1 ring-gray-200"
      }`}
    >
      <h3
        className={`text-xl font-bold mb-6 ${
          highlight ? "text-white" : "text-charcoal"
        }`}
      >
        {title}
      </h3>
      {items ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.size}
              className={`flex justify-between items-center pb-3 border-b ${
                highlight ? "border-gray-600" : "border-gray-100"
              }`}
            >
              <span
                className={`text-sm ${
                  highlight ? "text-gray-300" : "text-slate"
                }`}
              >
                {item.size}
              </span>
              <span className="text-base font-semibold">{item.price}</span>
            </div>
          ))}
        </div>
      ) : (
        <p
          className={`text-3xl font-bold ${
            highlight ? "text-white" : "text-charcoal"
          }`}
        >
          {note}
        </p>
      )}
    </div>
  );
}
