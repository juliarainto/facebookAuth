import request from 'request-promise-native';
import fs from 'fs';
import express from 'express';
import https from 'https';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import { Validator } from 'jsonschema';

// TRUE = Certificates, FALSE = local
const sslEnabled = true;

const app = express();
const PORT = 3005;

// JSON file settings
const v = new Validator();
const schema = { type: 'object' };
const FILE = 'clients.json';
const encoding = 'utf-8';

// APP credentials
const clientID = "";
const clientSecret = "";

const useClientsOwnAccessDataOnApiCallsIfExist = true;

// FACEBOOK LOGIN

passport.use(
  new FacebookStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: 'https://ADDRESS_HERE.com:3005/auth/facebook/callback/',
      profileFields: ['id'],
    },
    (accessToken, refreshToken, profile, cb) => {
      console.log(profile, accessToken);
      cb(null, profile, accessToken);
    },
  ),
);

app.use(passport.initialize());

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get(
  '/auth/facebook/callback/',
  passport.authenticate('facebook', {
    session: false,
  }),
  (req, res) => {
    res.redirect(`https://ADDRESS_HERE.com:3005/redirectmsg`);
  },
);

app.get('/redirectmsg', async (req, res) => {
  try {
    res.sendFile(`${__dirname}/redirect.html`);
  } catch (e) {
    console.log(e);
  }
});

app.use(
  cors(),
  bodyParser.json(),
  bodyParser.urlencoded({
    extended: false,
  }),
  morgan('dev'),
);

const cacheData = {};

// These are the fields to query
const fields =
  'id,message,full_picture,picture,link,name,description,type,icon,created_time,from,object_id,shares,likes.summary(true),comments.summary(true)';

const refectCount = 10;

async function checkFile() {
  return new Promise((resolve, reject) => {
    fs.stat(FILE, (err, file) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.writeFile(FILE, JSON.stringify({}, null, 2), encoding, e => {
            if (e) reject(e);
            console.log('File did not exists... Created!');
            resolve(true);
          });
        } else {
          reject(err);
        }
      }
      resolve(file);
    });
  });
}

async function validateJSON(data) {
  return new Promise((resolve, reject) => {
    if (v.validate(data, schema).valid) {
      resolve();
    } else {
      reject(new Error('Error validating JSON data. Invalid JSON'));
    }
  });
}

async function write(jsonData) {
  return new Promise((resolve, reject) => {
    fs.writeFile(FILE, JSON.stringify(jsonData, null, 2), encoding, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function read() {
  return new Promise((resolve, reject) => {
    fs.readFile(FILE, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

app.post('/credentials/:pageid/:credentials', async (req, res) => {
  const { pageid } = req.params;
  const { credentials } = req.params;

  let message = '';
  if (!pageid || !credentials) {
    return res.status(400).json({
      success: false,
      message: 'Pageid/credentials missing or in invalid format!',
    });
  }

  try {
    await checkFile();

    const originalContent = JSON.parse(await read());

    console.log('----- Original Data -----');
    console.log(originalContent);

    if (pageid in originalContent) {
      if (originalContent[pageid] === credentials) {
        message = 'Credentials and login information already exists';
      } else {
        message = 'Old credentials were found and new credentials were added.';
        // Validate & Save
        originalContent[pageid] = credentials;
      }
    } else {
      message =
        'New credentials ja informations added.';
      // Validate & Save
      originalContent[pageid] = credentials;
    }

    // Validate the JSON to be written
    await validateJSON(originalContent);

    await write(originalContent);
    console.log(originalContent);
    const updatedContent = await read();

    console.log('----- Updated Data -----');
    console.log(updatedContent);
    return res.status(200).json({
      success: true,
      message,
      data: originalContent,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      success: false,
      message: e.toString(),
    });
  }
});

// SOCIAL PLUGIN

// Updating cache every 15 minutes
setInterval(() => {
  console.log('Refetching data from FB API...');
  Object.keys(cacheData).forEach(async pageid => {
    let getDataFromAPI;

    if (useClientsOwnAccessDataOnApiCallsIfExist) {
      const credentials = JSON.parse(await read());

      if (pageid in credentials) {
        console.log('Refetch.. Using clients own credentials');
        const ClientsCreds = credentials[pageid];
        getDataFromAPI = await request.get({
          url: `https://graph.facebook.com/${pageid}/posts?limit=${refectCount}&access_token=${ClientsCreds}&fields=${fields}`,
          json: true,
        });
        cacheData[pageid] = getDataFromAPI;
      } else {
        getDataFromAPI = await request.get({
          url: `https://graph.facebook.com/${pageid}/posts?limit=${refectCount}&access_token=${clientID}|${clientSecret}&fields=${fields}`,
          json: true,
        });
        cacheData[pageid] = getDataFromAPI;
      }
    } else {
      getDataFromAPI = await request.get({
        url: `https://graph.facebook.com/${pageid}/posts?limit=${refectCount}&access_token=${clientID}|${clientSecret}&fields=${fields}`,
        json: true,
      });
      cacheData[pageid] = getDataFromAPI;
    }
  });
  return true;
}, 15 * 60 * 1000); // 15 minutes

app.get('/:pageid/:count', async (req, res) => {
  // Take the pageID and count how many posts to return from the request
  // If not given, use the static ones
  const { pageid } = req.params;
  const { count } = req.params;

  if (!pageid || !Number(count)) {
    console.log('missing');
    return res.status(400).json({
      success: false,
      message: 'Pageid/count missing or in invalid format!',
    });
  }

  console.log('Starting the routine...');

  try {
    console.log('----------------------------');
    console.log('Fetching post information...');

    // Checking if credentials exists

    if (pageid in cacheData) {
      console.log('This pageid exists. Sending response from cache!');
      return res.status(200).json({
        success: true,
        data: cacheData[pageid],
      });
    }

    let getDataFromAPI;

    if (useClientsOwnAccessDataOnApiCallsIfExist) {
      const credentials = JSON.parse(await read());

      if (pageid in credentials) {
        console.log('Using clients own credentials');
        const ClientsCreds = credentials[pageid];
        getDataFromAPI = await request.get({
          url: `https://graph.facebook.com/${pageid}/posts?limit=${count}&access_token=${ClientsCreds}&fields=${fields}`,
          json: true,
        });
      } else {
        getDataFromAPI = await request.get({
          url: `https://graph.facebook.com/${pageid}/posts?limit=${count}&access_token=${clientID}|${clientSecret}&fields=${fields}`,
          json: true,
        });
      }
    } else {
      getDataFromAPI = await request.get({
        url: `https://graph.facebook.com/${pageid}/posts?limit=${count}&access_token=${clientID}|${clientSecret}&fields=${fields}`,
        json: true,
      });
    }

    console.log('This pageid does not yet exist in cache! Adding...');
    const data = await getDataFromAPI;
    cacheData[pageid] = data;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Certificates

if (sslEnabled) {
  const httpsOptions = {
    key: fs.readFileSync('ENTER CERTIFICATE PATH HERE'),
    cert: fs.readFileSync('ENTER CERTIFICATE PATH HERE'),
  };

  https.createServer(httpsOptions, app).listen(PORT);
  console.log(`Server listening on port: ${PORT}`);
} else {
  app.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}`);
  });
}
