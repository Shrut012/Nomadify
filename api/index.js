const path = require("path");
const dotenvPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: dotenvPath });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const User = require("./models/User.js");
const Post = require("./models/Post.js");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");

const salt = bcrypt.genSaltSync(10);
const secret = process.env.SECRET;

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

const host = process.env.DATABASE_HOST;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const DB_URL = `mongodb+srv://${user}:${password}@${host}`;

mongoose
	.connect(`${DB_URL}/?authSource=admin`)
	.then(() => {
		console.log("db connection successfull");
	})
	.catch((err) => {
		console.log(err);
	});

app.post("/register", async (req, res) => {
	const { username, password } = req.body;
	try {
		const userDoc = await User.create({
			username,
			password: bcrypt.hashSync(password, salt),
		});
		res.json(userDoc);
	} catch (err) {
		res.status(400).json(err);
	}
});

app.post("/login", async (req, res) => {
	const { username, password } = req.body;
	const userDoc = await User.findOne({ username });
	const passOk = bcrypt.compareSync(password, userDoc.password);
	if (passOk) {
		// logged in
		jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
			if (err) throw err;
			res.cookie("token", token).json({
				username,
				id: userDoc._id,
			});
		});
	} else {
		res.status(400).json("wrong credentials");
	}
});

app.get("/profile", (req, res) => {
	const { token } = req.cookies; //verifying
	if (!token) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	jwt.verify(JSON.stringify(token), secret, {}, (err, info) => {
		if (err) throw err;
		res.json(info);
	});
});

app.post("/logout", (req, res) => {
	res.cookie("token", "").json("ok");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
	const { originalname, path } = req.file;
	const parts = originalname.split(".");
	const ext = parts[parts.length - 1];
	const newPath = path + "." + ext;
	fs.renameSync(path, newPath);

	const { token } = req.cookies;
	jwt.verify(token, secret, async (err, info) => {
		if (err) throw err;
		const { title, summary, content } = req.body;
		const postDoc = await Post.create({
			title,
			summary,
			content,
			cover: newPath,
			author: info.id,
		});
		res.json(postDoc);
	});
});

// app.put("/post", uploadMiddleware.single("file"), async (req, res) => {
// 	let newPath = null;
// 	if (req.file) {
// 		const { originalname, path } = req.file;
// 		const parts = originalname.split(".");
// 		const ext = parts[parts.length - 1];
// 		newPath = path + "." + ext;
// 		fs.renameSync(path, newPath);
// 	}

// 	const { token } = req.cookies;
// 	jwt.verify(token, secret, {}, async (err, info) => {
// 		if (err) throw err;
// 		const { id, title, summary, content } = req.body;
// 		try {
// 			const postDoc = await Post.findById(id);
// 		} catch (err) {
// 			console.log(err);
// 		}
// 		const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
// 		console.log(stringify(postDoc.author), JSON.stringify(info.id));
// 		if (!isAuthor) {
// 			return res.status(400).json("you are not the author");
// 		}
// 		const resp = await postDoc.update({
// 			title,
// 			summary,
// 			content,
// 			cover: newPath ? newPath : postDoc.cover,
// 		});

// 		if (resp.ok) res.json(postDoc);
// 	});
// });

app.put("/post", uploadMiddleware.single("file"), async (req, res) => {
	let newPath = null;
	if (req.file) {
		const { originalname, path } = req.file;
		const parts = originalname.split(".");
		const ext = parts[parts.length - 1];
		newPath = path + "." + ext;
		fs.renameSync(path, newPath);
	}

	const { token } = req.cookies;
	jwt.verify(token, secret, {}, async (err, info) => {
		if (err) throw err;
		const { id, title, summary, content } = req.body; //id => post id
		const postDoc = await Post.findById(id);
		const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id); //info.id => token has user id
		if (!isAuthor) {
			return res.status(400).json("you are not the author");
		}

		// await postDoc.update({
		// 	title: title,
		// 	summary: summary,
		// 	content: content,
		// 	cover: newPath ? newPath : postDoc.cover,
		// });

		await Post.updateOne(
			{ _id: id },
			{
				title: title,
				summary: summary,
				content: content,
				cover: newPath ? newPath : postDoc.cover,
			}
		);

		res.json(postDoc);
	});
});

app.get("/post", async (req, res) => {
	res.json(
		await Post.find()
			.populate("author", ["username"])
			.sort({ createdAt: -1 })
			.limit(20)
	);
});

app.get("/post/:id", async (req, res) => {
	const { id } = req.params;
	const postDoc = await Post.findById(id).populate("author", ["username"]);
	res.json(postDoc);
});

app.listen(4000);
