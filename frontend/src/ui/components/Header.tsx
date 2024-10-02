import { Link } from "react-router-dom";
import logo from "~assets/logo.png";

interface HeaderProps {
	children?: JSX.Element | JSX.Element[];
}

export function Header({ children }: HeaderProps) {
	return (
		<div className="sticky top-0 left-0 z-10 flex h-16 w-screen bg-neutral shadow-2xl">
			<div className="m-2">
				<Link to="/">
					<img
						className="h-12 w-12 cursor-pointer object-scale-down"
						src={logo}
						alt="Logo"
					/>
				</Link>
			</div>
			<div className="item-center my-auto grow">{children}</div>
		</div>
	);
}
