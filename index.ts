import { PrismaClient } from '@prisma/client';
import { Proxy } from './model/Proxy';
import axios from 'axios';

const prisma = new PrismaClient();

async function seedProxies() {
  const proxies = [
    { ip: '111.111.111.111', port: 8080, login: 'user1', password: 'pass1' },
    { ip: '222.222.222.222', port: 8080, login: 'user2', password: 'pass2' },
  ];

  for (const proxy of proxies) {
    await prisma.proxy.create({
      data: proxy,
    });
  }

  console.log('Proxies have been seeded.');
}

seedProxies()
  .catch((error) => console.error(error))
  .finally(() => prisma.$disconnect());

  
const apiUrl = 'https://kaspi.kz/yml/offer-view/offers/' || process.env.URL_STORE;

async function fetchProductData(article) {
  const proxyList = await prisma.proxy.findMany();
  for (let i = 0; i < proxyList.length; i++) {
    const proxy = proxyList[i];
    const axiosConfig = {
      proxy: {
        host: proxy.ip,
        port: proxy.port,
        auth: {
          username: proxy.login,
          password: proxy.password,
        },
      },
      timeout: 7000, // 7 seconds
    };

    try {
      const response = await axios.post(`${apiUrl}${article}`, null, axiosConfig);
      console.log(`Data for article ${article} successfully fetched!`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching data for article ${article}:`, error.message);
      if (i < proxyList.length - 1) {
        console.log('Trying next proxy...');
        continue;
      }
      console.log('No more proxies to try, skipping article.');
      return null;
    }
  }
}

async function main() {
  const articles = Array.from({ length: 5000 }, (_, i) => i + 1);

  for (const article of articles) {
    let retryCount = 0;
    while (retryCount < 3) {
      const data = await fetchProductData(article);
      if (data) {
        console.log(`Data for article ${article}:`, data);
        break;
      } else {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait 15 seconds
      }
    }
  }

  prisma.$disconnect();
}

main().catch((error) => console.error(error));
