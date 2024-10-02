interface Props {
	children: React.ReactNode;
	styling?: string;
}

export function StandardContainer({ children, styling }: Props) {
	return (
		<div
			className={`rounded-3xl bg-base-300 text-base-content shadow-xl ${styling}`}
		>
			{children}
		</div>
	);
}
