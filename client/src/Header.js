import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";

const Header = () => {
	const { userInfo, setUserInfo } = useContext(UserContext);

	useEffect(() => {
		fetch("http://localhost:4000/profile", {
			credentials: "include",
		}).then((response) => {
			response.json().then((userInfo) => {
				setUserInfo(userInfo);
			});
		});
	}, [setUserInfo]);

	function logout() {
		fetch("http://localhost:4000/logout", {
			method: "POST",
			credentials: "include",
		});
		setUserInfo(null);
	}

	const username = userInfo?.username;

	return (
		<header>
			<Link to="/" className="logo">
				NOMADIFY
			</Link>
			<nav>
				{username && (
					<>
						<div>
							<span
								style={{
									fontWeight: "bold",
									display: "flex",
									justifyContent: "center",
								}}
							>
								Hello {username}
							</span>
						</div>
						<div className="header_nav_div">
							<Link to="/create" className="header_nav_div_link">
								{" "}
								Create new post
							</Link>
							<a href="/#" onClick={logout}>
								Logout
							</a>
						</div>
					</>
				)}
				{!username && (
					<>
						<div className="logout_state">
							<Link to="/register">Register </Link>
							<Link to="/login">Already Registered? Login</Link>
						</div>
					</>
				)}
			</nav>
		</header>
	);
};

export default Header;
