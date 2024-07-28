const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const cors = require('cors');
const app = express();
const fileUpload = require('express-fileupload');
const port = 5000;
const cookieparser = require('cookie-parser');
const fs = require('fs');
app.use(express.static('uploads'));

app.use(cookieparser());
app.use(cors('*'));
app.use(express.static(__dirname));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

const connection = mysql.createConnection({
  port: 3306,
  host: "localhost",
  user: "root",
  password: "nitpy@25",
  database: "auctiondb"
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database...');
});

function queryPromise(connection, sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});

app.get('/homepage', (req, res) => {
  const uid = req.cookies.uid;
  if (!uid) {
    return res.redirect('/');
  }

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.sendFile(path.join(__dirname, 'mainpage.html'));
});

app.get('/itempage' , (req,res)=>{
  const uid = req.cookies.uid;
  if (!uid) {
    return res.redirect('/');
  }

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  res.sendFile(path.join(__dirname, 'itempage.html'));
})

app.get('/yourauctions' , (req,res)=>{
  const uid = req.cookies.uid;
  if (!uid) {
    return res.redirect('/');
  }

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

  res.sendFile(path.join(__dirname, 'auctionspage.html'));
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const query = `SELECT * FROM userlogin WHERE email = ? AND password = ?`;
  
    try {
      const result = await queryPromise(connection, query, [email, password]);
      if (result.length > 0) {
        res.cookie('uid', result[0].UID);
        console.log("hello")
        res.status(200).send({ success: true, credentials: true, message: 'User verified successfully.' });
      
      } else {
        res.status(200).send({ success: true, credentials: false, message: 'Incorrect Credentials! Please try Signing Up' });
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      res.status(500).send({ success: false, message: 'Error verifying user.' });
    }
  });


app.post('/signup', async (req, res) => {
  const { fname, sname, email, password } = req.body;
  const query = `SELECT * FROM userlogin WHERE email = ?`;

  try {
    const result = await queryPromise(connection, query, [email]);
    if (result.length > 0) {
      res.status(200).send({ success: false, message: 'User already exists. Try Forgot password.' });
    } else {
      const insertQuery = `INSERT INTO userlogin (fname, sname, email, password) VALUES (?, ?, ?, ?)`;
      await queryPromise(connection, insertQuery, [fname, sname, email, password]);
      res.status(200).send({ success: true, message: 'User added successfully. Head over to Sign in' });
    }
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(200).send({ success: false, message: 'Error adding user.' });
  }
});

app.post('/display', async (req, res) => {
  const uid = req.cookies.uid;

  const userQuery = 'SELECT * FROM userlogin WHERE uid = ?';
  const itemsQuery = `
        SELECT i.AID, i.minbid, i.curbid, i.description, i.name, i.end_date, b.image 
        FROM items i 
        LEFT JOIN bidimages b ON i.AID = b.AID
        WHERE i.UID != ?`;

  try {
    const userResult = await queryPromise(connection, userQuery, [uid]);
    const itemsResult = await queryPromise(connection, itemsQuery, [uid]);
    itemsResult.forEach(item => {
      if (item.image) {
        item.image = item.image.toString('base64');
      }
    });
    res.status(200).send({
      success: true,
      name: userResult[0].fname,
      items: itemsResult
    });
  } catch (err) {
    console.error("Error fetching user or items", err);
    res.status(500).send({ success: false });
  }
});

app.post('/gotobid', (req, res) => {
  const itemid = req.body.aid;
  res.cookie('itemid', itemid);
  res.status(200).send({ success: true });
});

app.post('/get-product-details', async (req, res) => {
  const aid = req.cookies.itemid;
  if (!aid) {
    return res.status(400).send({ success: false, message: 'AID is required' });
  }

  const productQuery = `
        SELECT i.AID, i.name, i.description, i.minbid, i.curbid, i.end_date, b.image 
        FROM items i 
        LEFT JOIN bidimages b ON i.AID = b.AID 
        WHERE i.AID = ?;
    `;

  const reviewsQuery = `
        SELECT r.rating, r.review, u.fname 
        FROM reviews r 
        JOIN userlogin u ON r.uid = u.UID 
        WHERE r.aid = ?;
    `;

  const bidsQuery = `
        SELECT pb.amount, u.fname 
        FROM previous_bids pb 
        JOIN userlogin u ON pb.uid = u.UID 
        WHERE pb.aid = ? 
        ORDER BY pb.amount ASC;
    `;

  try {
    const productResults = await queryPromise(connection, productQuery, [aid]);
    if (productResults.length === 0) {
      return res.status(404).send({ success: false, message: 'Product not found' });
    }
    const product = productResults[0];
    const imageBase64 = product.image ? product.image.toString('base64') : null;

    const reviewResults = await queryPromise(connection, reviewsQuery, [aid]);
    const bidsResults = await queryPromise(connection, bidsQuery, [aid]);

    res.status(200).send({
      success: true,
      product: {
        AID: product.AID,
        name: product.name,
        description: product.description,
        minbid: product.minbid,
        curbid: product.curbid,
        image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
        end_date: product.end_date
      },
      reviews: reviewResults,
      previousbids: bidsResults
    });
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).send({ success: false, message: 'Error fetching product details' });
  }
});

app.post('/display-auction-items', async (req, res) => {
    const uid = req.cookies.uid;

    const userQuery = 'SELECT * FROM userlogin WHERE uid = ?';
    const itemsQuery = `
        SELECT i.AID, i.minbid, i.curbid, i.description, i.name, i.end_date, b.image 
        FROM items i 
        LEFT JOIN bidimages b ON i.AID = b.AID WHERE i.UID = ?`;

    try {
        const userResult = await queryPromise(connection, userQuery, [uid]);
        const itemsResult = await queryPromise(connection, itemsQuery, [uid]);
        itemsResult.forEach(item => {
            if (item.image) {
                item.image = item.image.toString('base64');
            }
        });
        res.status(200).send({
            success: true,
            name: userResult[0].fname,
            items: itemsResult
        });
    } catch (err) {
        console.error("Error fetching user or items", err);
        res.status(500).send({ success: false });
    }
});


app.post('/addbid', async (req, res) => {
  const aid = req.cookies.itemid;
  const bidAmount = req.body.bamnt;
  const userId = req.cookies.uid;

  if (!aid || !bidAmount || !userId) {
    return res.status(400).send({ success: false, message: 'All fields are required' });
  }

  const checkBidQuery = `
        SELECT curbid, (SELECT uid FROM previous_bids WHERE aid = ? ORDER BY amount DESC LIMIT 1) AS highestBidder
        FROM items
        WHERE AID = ?
    `;

  try {
    const results = await queryPromise(connection, checkBidQuery, [aid, aid]);
    if (results.length === 0) {
      return res.status(404).send({ success: false, message: 'Product not found' });
    }

    const currentBid = results[0].curbid;
    const highestBidder = results[0].highestBidder;

    if (highestBidder == userId) {
      return res.status(200).send({ success: false, message: 'You cannot place a new bid on an item where you have the highest bid' });
    }

    if (bidAmount <= currentBid) {
      return res.status(200).send({ success: false, message: 'Bid amount must be greater than the current bid' });
    }

    const updateBidQuery = 'UPDATE items SET curbid = ? WHERE AID = ?';
    await queryPromise(connection, updateBidQuery, [bidAmount, aid]);

    const insertBidQuery = 'INSERT INTO previous_bids (aid, uid, amount) VALUES (?, ?, ?)';
    await queryPromise(connection, insertBidQuery, [aid, userId, bidAmount]);

    res.status(200).send({ success: true, message: 'Bid placed successfully' });
  } catch (err) {
    console.error('Error placing bid:', err);
    res.status(500).send({ success: false, message: 'Error placing bid' });
  }
});



app.post('/upload-item', async (req, res) => {
    const { name, minbid, end_date, description, image } = req.body;
    const uid = req.cookies.uid;

    if (!image) {
        return res.status(400).send({ success: false, message: 'No image provided' });
    }

    if (!uid) {
        return res.status(400).send({ success: false, message: 'UID is required' });
    }

    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');

    const insertItemQuery = `
        INSERT INTO items (name, minbid, end_date, description, uid) VALUES (?, ?, ?, ?, ?);
    `;
    const insertImageQuery = `
        INSERT INTO bidimages (AID, image) VALUES (?, ?);
    `;

    try {
        const itemResult = await queryPromise(connection, insertItemQuery, [name, minbid, end_date, description, uid]);
        const itemId = itemResult.insertId;
        await queryPromise(connection, insertImageQuery, [itemId, imageBuffer]);

        res.status(200).send({ success: true, message: 'Item uploaded successfully' });
    } catch (err) {
        console.error('Error inserting item or image:', err);
        res.status(500).send({ success: false, message: 'Error inserting item or image' });
    }
});

app.post('/remove-item',  async (req, res) => {
    const aid = req.body.aid;
    console.log(aid)

    if (!aid) {
        return res.status(400).send({ success: false, message: 'AID is required' });
    }

    const deleteItemQuery = 'DELETE FROM items WHERE AID = ?';

    try {
        const result = await queryPromise(connection, deleteItemQuery, [aid]);
        if (result.affectedRows == 0) {
            return res.status(404).send({ success: false, message: 'Item not found' });
        }
        res.status(200).send({ success: true, message: 'Item removed successfully' });
    } catch (err) {
        console.error('Error removing item:', err);
        res.status(500).send({ success: false, message: 'Error removing item' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('uid');
    res.redirect('/');
});


app.listen(port,()=>{
    console.log("Server listening on port" , port)
})