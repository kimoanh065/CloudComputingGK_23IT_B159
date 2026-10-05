require("dotenv").config();

const express = require("express");
const { engine } = require("express-handlebars");
const {
    connectDatabases,
    getReadDB,
    getWriteDB
} = require("./config/database");

const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const app = express();
const PORT = process.env.PORT || 3000;

// Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_SESSION_URI,
            dbName: "DB_23ITB159",
            collectionName: "sessions"
        }),

        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true
        }
    })
);

// Thông tin cá nhân hóa theo MSSV
const STUDENT = {
    name: "Đoàn Kim Oanh",
    id: "23IT.B159",
    prefix: "159",
    vat: 14
};

// Trang chủ - READ bằng tài khoản chỉ đọc
app.get("/", async (req, res) => {
    try {
        req.session.visits = (req.session.visits || 0) + 1;

        const db = getReadDB();

        const books = await db
            .collection("books")
            .find({})
            .toArray();

        res.render("home", {
            books,
            student: STUDENT,
            visits: req.session.visits
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi khi đọc dữ liệu!");
    }
});

// Thêm sách - WRITE bằng tài khoản chỉ ghi
app.post("/books", async (req, res) => {
    try {
        const { productCode, bookName, price } = req.body;

        // Mã sản phẩm bắt buộc bắt đầu bằng 159
        if (!productCode || !productCode.startsWith(STUDENT.prefix)) {
            return res.status(400).send(
                "Mã sản phẩm không hợp lệ! Mã phải bắt đầu bằng 159."
            );
        }

        const originalPrice = Number(price);

        if (!bookName || !Number.isFinite(originalPrice) || originalPrice < 0) {
            return res.status(400).send("Thông tin sách không hợp lệ!");
        }

        // VAT = (9 + 5)% = 14%
        const priceAfterVAT =
            Math.round(originalPrice * (1 + STUDENT.vat / 100) * 100) / 100;

        const book = {
            productCode,
            bookName,
            price: originalPrice,
            vat: STUDENT.vat,
            priceAfterVAT,
            createdAt: new Date()
        };

        // Chỉ sử dụng WRITE connection
        const db = getWriteDB();
        await db.collection("books").insertOne(book);

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi khi thêm sách!");
    }
});

// Kết nối cả READ và WRITE rồi mới mở server
connectDatabases()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server: http://localhost:${PORT}`);
            console.log("👩‍🎓 Đoàn Kim Oanh - 23IT.B159");
            console.log("💰 VAT: 14%");
        });
    })
    .catch((error) => {
        console.error("Không thể khởi động server:", error);
        process.exit(1);
    });