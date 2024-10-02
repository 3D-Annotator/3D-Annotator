import { ENV } from "env";
import { useEffect, useRef } from "react";
import { useAnnotator } from "~ui/annotator/contexts/AnnotatorContext";

const SHOW_STATS = ENV.ANNOTATOR_3D_SHOW_STATS;

export function Stats() {
	const statsRef = useRef<HTMLDivElement>(null);
	const annotator = useAnnotator();

	useEffect(() => {
		if (!SHOW_STATS || !annotator) return;

		const statsWrapper = statsRef.current;
		const stats = annotator.sceneManager.getStatsElement();

		stats.style.top = "";
		stats.style.left = "";
		stats.style.bottom = "0px";
		stats.style.right = "0px";
		statsWrapper?.appendChild(stats);

		return () => {
			statsWrapper?.removeChild(stats);
		};
	}, [annotator]);

	return <div ref={statsRef}></div>;
}
