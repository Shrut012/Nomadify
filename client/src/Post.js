import { formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";

export default function Post({
	_id,
	title,
	summary,
	cover,
	createdAt,
	author,
}) {
	return (
		<div className="post">
			<div className="image">
				{/* <Link to={`/post/${_id}`}> */}
				<img src={"http://localhost:4000/" + cover} alt="" style={{}} />
				{/* </Link> */}
			</div>
			<div className="texts">
				<Link to={`/post/${_id}`}>
					<h2 style={{ cursor: "pointer" }}>{title}</h2>
					<p className="info">
						{author.username}
						<time>{formatISO9075(new Date(createdAt))}</time>
					</p>
				</Link>
				<p className="summary">{summary}</p>
			</div>
		</div>
	);
}
