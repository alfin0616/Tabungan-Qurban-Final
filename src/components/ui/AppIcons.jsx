import React from 'react'
import instansiImg from '../../assets/icons/instansi.png'
import kelompokImg from '../../assets/icons/kelompok.png'
import anggotaImg from '../../assets/icons/anggota.png'
import tabunganImg from '../../assets/icons/tabungan.png'
import penarikanImg from '../../assets/icons/penarikan.png'
import setoranImg from '../../assets/icons/setoran.png'
import keuanganImg from '../../assets/icons/keuangan.png'
import { cn } from '../../lib/cn'

export const instansiIconSrc = instansiImg
export const kelompokIconSrc = kelompokImg
export const anggotaIconSrc = anggotaImg
export const tabunganIconSrc = tabunganImg
export const penarikanIconSrc = penarikanImg
export const setoranIconSrc = setoranImg
export const keuanganIconSrc = keuanganImg

export function InstansiIcon({ className = 'h-5 w-5', alt = 'Instansi', ...props }) {
  return (
    <img
      src={instansiImg}
      alt={alt}
      loading="lazy"
      className={cn('object-contain shrink-0 select-none inline-block', className)}
      {...props}
    />
  )
}

export function KelompokIcon({ className = 'h-5 w-5', alt = 'Kelompok', ...props }) {
  return (
    <img
      src={kelompokImg}
      alt={alt}
      loading="lazy"
      className={cn('object-contain shrink-0 select-none inline-block', className)}
      {...props}
    />
  )
}

export function AnggotaIcon({ className = 'h-5 w-5', alt = 'Anggota', ...props }) {
  return (
    <img
      src={anggotaImg}
      alt={alt}
      loading="lazy"
      className={cn('object-contain shrink-0 select-none inline-block', className)}
      {...props}
    />
  )
}

export function TabunganIcon({ className = 'h-5 w-5', alt = 'Tabungan', ...props }) {
  return (
    <img
      src={tabunganImg}
      alt={alt}
      loading="lazy"
      className={cn('object-contain shrink-0 select-none inline-block', className)}
      {...props}
    />
  )
}

export function PenarikanIcon({ className = 'h-5 w-5', alt = 'Penarikan', ...props }) {
  return (
    <img
      src={penarikanImg}
      alt={alt}
      loading="lazy"
      className={cn('object-contain shrink-0 select-none inline-block', className)}
      {...props}
    />
  )
}

export function SetoranIcon({ className = 'h-5 w-5', alt = 'Setoran', ...props }) {
  return (
    <img
      src={setoranImg}
      alt={alt}
      loading="lazy"
      className={cn('object-contain shrink-0 select-none inline-block', className)}
      {...props}
    />
  )
}

export function KeuanganIcon({ className = 'h-5 w-5', alt = 'Keuangan', ...props }) {
  return (
    <img
      src={keuanganImg}
      alt={alt}
      loading="lazy"
      className={cn('object-contain shrink-0 select-none inline-block', className)}
      {...props}
    />
  )
}

export default {
  InstansiIcon,
  KelompokIcon,
  AnggotaIcon,
  TabunganIcon,
  PenarikanIcon,
  SetoranIcon,
  KeuanganIcon,
  instansiIconSrc,
  kelompokIconSrc,
  anggotaIconSrc,
  tabunganIconSrc,
  penarikanIconSrc,
  setoranIconSrc,
  keuanganIconSrc,
}
