# GRÜN: Carbon Credit Exchange Platform

A decentralized platform for trading carbon credits using blockchain technology. It's pronounced "green".

## 🚀 Features

- Carbon credit tokenization on blockchain
- Secure document verification system
- Real-time trading marketplace
- Multi-currency payment support (FIAT & Crypto)
- Administrative dashboard for credit verification
- Automated compliance checks

## 🛠 Technology Stack

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Django, Django REST Framework
- **Blockchain**: Ethereum/Polygon, Web3.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Storage**: AWS S3
- **Container**: Docker
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js (v16+)
- Python (v3.11+)
- Docker and Docker Compose
- MetaMask wallet
- AWS account (for production)

## 🔧 Installation

1. **Clone the repository**
bash
git clone https://github.com/grun/grun.git
cd grun

2. **Set up environment variables**
bash
cp .env.example .env
Edit .env with your configuration

3. **Start the development environment**
```bash
./scripts/init-dev.sh
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- API Documentation: http://localhost:8000/api/docs
- Admin Interface: http://localhost:8000/admin

## 🏗 Project Structure
.
├── grun/ # Main Django app
│ ├── api/ # REST API endpoints
│ └── core/ # Core functionality
├── frontend/ # React frontend
│ ├── public/ # Static files
│ └── src/ # Source code
├── docker/ # Docker configuration
└── scripts/ # Utility scripts

## 🔑 Smart Contract Deployment

1. Configure network in `hardhat.config.ts`
2. Set deployment parameters in `.env`
3. Run deployment:
```bash
cd frontend
npm run deploy:mumbai # For Mumbai testnet
npm run deploy:polygon # For Polygon mainnet
```

## 🧪 Testing

### Backend Tests

```bash
python manage.py test
```

Run with coverage
```bash
coverage run manage.py test
coverage report
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Smart Contract Tests

```bash
cd frontend
npm run test:contracts
```


## 📚 API Documentation

Detailed API documentation is available at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## 🔒 Security Considerations

- All sensitive data is encrypted at rest
- Document uploads are scanned for viruses
- AWS S3 encryption is enabled
- JWT authentication for API endpoints
- CORS configuration for frontend security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

[MIT License](LICENSE)

## 📞 Support

For support, email me.