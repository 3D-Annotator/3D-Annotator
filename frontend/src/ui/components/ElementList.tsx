interface ElementListProps {
	items: JSX.Element | JSX.Element[];
}

export function ElementList({ items }: ElementListProps) {
	return <ul className="mx-auto w-full items-center">{items}</ul>;
}
