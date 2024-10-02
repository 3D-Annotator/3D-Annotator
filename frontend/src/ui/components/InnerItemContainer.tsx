interface Props {
	children: React.ReactNode;
}

export function InnerItemContainer({ children }: Props) {
	return (
		<div className="rounded-3xl bg-base-100 text-base-content">
			{children}
		</div>
	);
}
