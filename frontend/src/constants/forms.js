export const emptyShipment = {
  title: '', cargoType: '', weightKg: '', description: '',
  originAddress: '', originLat: 37.5665, originLng: 126.978,
  destinationAddress: '', destinationLat: 37.4979, destinationLng: 127.0276,
  scheduledStartAt: '',
  cargoImageDataUrls: [], cargoImageNames: [],
}

export const emptySignup = { email: '', password: '', name: '', role: 'SHIPPER', companyName: '', vehicleType: '', phone: '' }
export const emptyInquiry = { companyName: '', contactName: '', email: '', phone: '', inquiryType: '도입 문의', message: '' }
export const emptyNotice = { category: '플랫폼 공지', title: '', summary: '', pinned: false }
export const emptyFaq = { category: '이용 안내', question: '', answer: '', sortOrder: 1 }
