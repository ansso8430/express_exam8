const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const nunjucks = require('nunjucks');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const logger = require('./lib/logger');
const bootStrap = require('./boot');


// 라우터
const memberRouter = require('./routes/member');
const mainRouter = require('./routes');

const app = express();

dotenv.config();

app.set('PORT', process.env.PORT || 3000);
app.set("view engine", "html");
nunjucks.configure(path.join(__dirname, 'views'), {
    express : app,
    watch: true,
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended : false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave : false,
    saveUninitialized : true,
    secret : process.env.COOKIE_SECRET,
    cookie : {
        // 세션 쿠키 변경, 설정 > 서버상에서만 가능
        httpOnly : true, 
    },
    name : "yhsessid",
}));

// 사이트 초기화 미들웨어
app.use(bootStrap);

// 라우터 등록
app.use(mainRouter); // "/" 생략
app.use("/member", memberRouter);

// 없는 페이지 라우터
app.use((req, res, next) => {
    const err = new Error(`${req.url}은 없는 페이지 입니다.`);
    err.status = 404;
    next(err);
});

// 오류 처리 라우터
app.use((err, req, res, next) => {
    const data = {
        message : err.message,
        status : err.status || 500,
        stack : err.stack,
    };

    // 로그 기록
    logger(`[${data.status}]${data.message}`, 'error');
    logger(data.stack, 'error');

    if(process.env.NODE_ENV === 'production') {
        delete data.stack;
    }
    return res.status(data.status).render('error', data);
});

app.listen(app.get('PORT'), () => {
    console.log(app.get('PORT'), '번 포트에서 서버 대기중');
});