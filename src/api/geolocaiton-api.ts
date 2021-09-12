import axios from 'axios';

export async function getUserCountry(): Promise<string> {
  const apiKey = 'ea660dfa3e194274980d2a8fd529b287';
  const response = await axios.get('https://api.ipgeolocation.io/ipgeo', { params: { apiKey } });
  return response.data.country_code2;
}
