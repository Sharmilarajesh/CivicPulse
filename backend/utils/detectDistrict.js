const axios = require('axios')

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
  "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
  "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
]

const ALIASES = {
  "trichy": "Tiruchirappalli",
  "tiruchy": "Tiruchirappalli",
  "tuticorin": "Thoothukudi",
  "ooty": "Nilgiris",
  "nilgiri": "Nilgiris",
  "kovai": "Coimbatore"
}

const normalizeDistrict = (rawDistrict) => {
  if (!rawDistrict) return null
  const normalizedRaw = rawDistrict.toLowerCase().trim()
  
  // Check exact aliases or partial matches first
  if (ALIASES[normalizedRaw]) {
    return ALIASES[normalizedRaw]
  }
  for (const [alias, official] of Object.entries(ALIASES)) {
    if (normalizedRaw.includes(alias)) {
      return official
    }
  }

  for (const district of TAMIL_NADU_DISTRICTS) {
    const dLower = district.toLowerCase()
    if (normalizedRaw.includes(dLower) || dLower.includes(normalizedRaw)) {
      return district
    }
  }
  return rawDistrict
}

const detectDistrict = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    // Add User-Agent as Nominatim requires it
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CivicPulse/1.0 (contact@civicpulse.gov)'
      }
    })
    
    const address = response.data.address
    if (!address) return null

    // Nominatim returns district info typically in one of these fields depending on the region
    const district = address.state_district || address.county || address.city_district || null
    return normalizeDistrict(district)
  } catch (err) {
    console.error('Geocoding error:', err.message)
    return null
  }
}

const geocodeAddressText = async (queryText) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&limit=1&addressdetails=1`
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'CivicPulse/1.0 (contact@civicpulse.gov)'
      }
    })

    if (response.data && response.data.length > 0) {
      const result = response.data[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      const addr = result.address || {}
      const district = addr.state_district || addr.county || addr.city_district || null
      return { lat, lng, district: normalizeDistrict(district) }
    }
    return null
  } catch (err) {
    console.error('Text geocoding error:', err.message)
    return null
  }
}

module.exports = {
  detectDistrict,
  geocodeAddressText,
  normalizeDistrict
}
