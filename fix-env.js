const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

const serviceAccount = {
    "type": "service_account",
    "project_id": "studio-6606920957-66aff",
    "private_key_id": "bd07e71d76726eeae384e2102d3edade68ad8e90",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDELojXLpvqPG/V\nPYOz35Ns2hxRhheWw5I7n0Q3pWeLMuqJjqVtAeFw7+jyjlC8acdjhcz7zytufu2u\nwGYzcpNZ1b2Wb+2MToeQwhJYhKyqPxuHlLOorv4rbrsFF9uzBBbeJ/+Kf/gmAQGP\nTJW5qqt0RA9ZVvzPFTI+BLxZpS2ZB+r/Sm+qiVqy1W+zUdlexKMZWodT8YY8v/OT\nGWy03asM4cu8Zez5MKRkAQCRBO4BCTiQRnyD2LQvgPwLgfR2ps\noakt1R6Ryrh+P/\n+nj7pzj84xnnvE5lHEzY9YefSoAs6pyCPVoqwHMCwh8bo+MoiV0ICST+aNFmI+ah\nZ8NfmKTLAgMBAAECggEAQ3oUBBtacmMuPgSl/6DXVtngYqQCCg+jhRFfR9qC9kxh\ngkXHnWpHre4+y+rqVxv1AkS7wCK+OAe9Xd18aZavmvca+hrudFNwanhuEfc0YmxJ\nXkVl1A+4iZzRA8v0e6rc6LWOPgeNBRlUfYLkftN2nItqUhrK4rlSKiW72QOo3tjR\nFIynx1W7ftOY0Q+hjt7f+Hg/s59IzST8rgSUlVzlmf9VzsRipQp4MWLC/iGOoSFM\nd0rLKKu+Z7dfLxOKn0a5xtXTPnEfTg0qZih/eZu6KkdrsHUO06ES/XEOBDhAOGOR\nO2kzEiw87vC+mY6rnvghsadj8hbPOR7sz0uVm4bGIQKBgQD05CFAAlcFiK2AnUSc\nzbIxWKi9Lngy3LDPZy/orO+4OlgceCC/8zM+LF/7La7C0JTY2oRZgkJvnTcmC1nB\nNcbtCDFTUXNH/jCMgEMo3GjvqKzuCi0onHMf9sN9pZS57X9kY/sJs4Y8Pm/3n0kA\n5juxQTi8pG2ut6jsRaRkxDWRKwKBgQDNFMDBodS7SlFG32XF6RaXZY2tu6mZSHNg\n8R7edduv6L8wWln0Ri7bCn3lT9ePTxicDbD7mTC/j4lzzerjWsCzJy4NTnL7qzfA\n2j+K1e1PI01swQz71dMUp1I2nbMcph79pGJNENkFXkoEQOHEUiBTtmcLIoXPaIyM\nOpALIJkq4QKBgHRGQRdQRRtGiwLPKT2+WMYfT3cLslyL9pNzbgbu3Z8+bImP7BTX\nl1QE48myJhEv0gyorECHnZ27Ku0wZHxdWUdAJZNmz/K12T1MxRaImHZ6Qyl+wXRP\n3EWn96gXz2b8Qglbg11W1PyTtLwA8DuyFVOTISpIdB+J6nXMl0KU+s4jAoGAPROX\nLJPDxVumxRK3Pq/ieIhYH4uqQOpg4lgtN1ema8dHWWEvNR7JyZZgVDDpI9cMnz08\nnlHLQOHAr+p9r+RRS4m5n2DjwawGWLsm/XQkztLWtjLwaPgPezExvO5Ob5PR2vxg\nAk+oMn8YUBf6pPtIgWXrXleTvmeGpCS0zXuR4kECgYB4raFyRaI5biw0hqsQ1OX6\nmc1TUuafz7AKWamFstrJmubun9A0TDKuHXBYpcoPPLzuPfHwkB6soV6qTMbtzViP\nPiczoC5zvAzNJ471LDX/aoltDTvSpfD0Ood+APVYNsajluOgNsiTXhR1CYMIgZbt\n24hRRw7RtTnFLqNQiRosdQ==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@studio-6606920957-66aff.iam.gserviceaccount.com",
    "client_id": "106031174125711134717",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40studio-6606920957-66aff.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

const jsonString = JSON.stringify(serviceAccount);
const envContent = `SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=team@internal-asc.org
FIREBASE_SERVICE_ACCOUNT_KEY='${jsonString}'
`;

fs.writeFileSync(envPath, envContent);
console.log('Successfully fixed .env.local');
