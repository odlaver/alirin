import { describe, expect, it } from 'vitest'
import { CITY_BOUNDS, KECAMATAN_DATA, KELURAHAN_ADM4, isInsideCity, resolveAdm4 } from './bandarLampungAreas.js'

describe('master wilayah Kota Bandar Lampung', () => {
  it('memuat 20 kecamatan dan 126 kelurahan', () => {
    const kecamatan = Object.keys(KECAMATAN_DATA)
    const kelurahan = Object.values(KECAMATAN_DATA).flat()
    expect(kecamatan).toHaveLength(20)
    expect(kelurahan).toHaveLength(126)
  })

  it('tidak memuat kelurahan ganda dalam satu kecamatan', () => {
    for (const [kecamatan, daftar] of Object.entries(KECAMATAN_DATA)) {
      expect(new Set(daftar).size, `duplikat di ${kecamatan}`).toBe(daftar.length)
    }
  })

  // Lima kelurahan ini sebelumnya tidak ada, sehingga titik yang dipilih di
  // wilayah tersebut selalu ditolak validasi.
  it.each([
    ['Kedamaian', 'Tanjung Gading'],
    ['Rajabasa', 'Gedong Meneng'],
    ['Rajabasa', 'Gedong Meneng Baru'],
    ['Tanjung Karang Pusat', 'Pasir Gintung'],
    ['Teluk Betung Utara', 'Gulak Galik'],
  ])('memuat %s / %s', (kecamatan, kelurahan) => {
    expect(KECAMATAN_DATA[kecamatan]).toContain(kelurahan)
  })

  it('tidak lagi memuat entri yang bukan kelurahan resmi', () => {
    const kelurahan = Object.values(KECAMATAN_DATA).flat()
    expect(kelurahan).not.toContain('Nyunyai')
    expect(kelurahan).not.toContain('Tukik')
  })

  it('memakai ejaan yang sama dengan sumber Kemendagri lewat BMKG', () => {
    expect(KECAMATAN_DATA['Teluk Betung Selatan']).toContain('Gedong Pakuon')
    expect(KECAMATAN_DATA['Teluk Betung Selatan']).toContain('Teluk Betung')
    expect(KECAMATAN_DATA['Teluk Betung Timur']).toContain('Parwata')
    expect(KECAMATAN_DATA.Rajabasa).toContain('Rajabasa Nunyai')
  })
})

describe('batas kota', () => {
  it('menerima titik di dalam Bandar Lampung', () => {
    expect(isInsideCity(-5.3971, 105.2668)).toBe(true)
  })

  it('menolak titik di luar kota dan koordinat tidak valid', () => {
    expect(isInsideCity(-6.2, 106.8)).toBe(false)
    expect(isInsideCity(CITY_BOUNDS.latMin - 0.1, 105.2668)).toBe(false)
    expect(isInsideCity('bukan angka', null)).toBe(false)
  })
})

describe('resolveAdm4', () => {
  it('memakai kode kelurahan bila tersedia', () => {
    expect(resolveAdm4('Kemiling', 'Pinang Jaya')).toEqual({ adm4: '18.71.13.1007', precision: 'kelurahan' })
  })

  // Sebelumnya hanya 20 kelurahan yang punya kode, dan 17 di antaranya salah.
  it('punya kode untuk seluruh 126 kelurahan', () => {
    const tanpaKode = []
    for (const [kecamatan, daftar] of Object.entries(KECAMATAN_DATA)) {
      for (const kelurahan of daftar) {
        if (resolveAdm4(kecamatan, kelurahan).precision !== 'kelurahan') {
          tanpaKode.push(`${kecamatan}/${kelurahan}`)
        }
      }
    }
    expect(tanpaKode).toEqual([])
    expect(KELURAHAN_ADM4).toHaveLength(126)
  })

  it('tiap kode hanya dipakai satu kelurahan', () => {
    const kode = KELURAHAN_ADM4.map(([, , adm4]) => adm4)
    expect(new Set(kode).size).toBe(kode.length)
  })

  it('mundur ke acuan kota bila wilayahnya tidak dikenali', () => {
    expect(resolveAdm4('Antah Berantah', 'Entah').precision).toBe('kota')
  })
})
