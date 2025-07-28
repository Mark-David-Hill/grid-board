import NavigationBoard from "../grid-board/NavigationBoard";
import LightsOutBoard from "../grid-board/LightsOutBoard";
import TopDownBoard from "../grid-board/TopDownBoard";
import SnakeBoard from "../grid-board/SnakeBoard";

export default function Home() {
  return (
    <div className="home-container">
      <div className="game-board-wrapper">
        <LightsOutBoard />
        <NavigationBoard />
        <TopDownBoard />
        <SnakeBoard />
      </div>
    </div>
  );
}
