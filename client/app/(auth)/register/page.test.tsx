/**
 * Unit Tests for Student Registration Form
 * 
 * Tests cover:
 * - Form validation (required fields, email format, password length)
 * - Organization code lookup
 * - Successful registration flow
 * - Error handling
 * 
 * Requirements: 1.1, 1.2, 2.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RegisterPage from './page'
import { useAuth } from '../../../lib/auth-context'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock auth context
vi.mock('../../../lib/auth-context', () => ({
  useAuth: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('RegisterPage - Form Validation', () => {
  const mockPush = vi.fn()
  const mockRegister = vi.fn()
  const mockVerifyOtp = vi.fn()
  const mockResendOtp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(useAuth as any).mockReturnValue({
      register: mockRegister,
      verifyOtp: mockVerifyOtp,
      resendOtp: mockResendOtp,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render registration form with all required fields', () => {
    render(<RegisterPage />)
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('should show organization code field for student role', () => {
    render(<RegisterPage />)
    
    // Student is the default role
    expect(screen.getByLabelText(/organization code/i)).toBeInTheDocument()
  })

  it('should show organization name field for org_admin role', async () => {
    render(<RegisterPage />)
    
    const roleSelect = screen.getByRole('combobox')
    fireEvent.click(roleSelect)
    
    await waitFor(() => {
      const orgAdminOption = screen.getByText('Org Admin')
      fireEvent.click(orgAdminOption)
    })
    
    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    })
  })

  it('should not show organization fields for public_student role', async () => {
    render(<RegisterPage />)
    
    const roleSelect = screen.getByRole('combobox')
    fireEvent.click(roleSelect)
    
    await waitFor(() => {
      const publicStudentOption = screen.getByText('Public Student')
      fireEvent.click(publicStudentOption)
    })
    
    await waitFor(() => {
      expect(screen.queryByLabelText(/organization code/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/organization name/i)).not.toBeInTheDocument()
    })
  })

  it('should validate password length (minimum 8 characters)', async () => {
    const { toast } = await import('sonner')
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters')
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should validate password confirmation match', async () => {
    const { toast } = await import('sonner')
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match')
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should require organization code for student role', async () => {
    const { toast } = await import('sonner')
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: '' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Organization code is required')
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should require organization name for org_admin role', async () => {
    const { toast } = await import('sonner')
    render(<RegisterPage />)
    
    // Change role to org_admin
    const roleSelect = screen.getByRole('combobox')
    fireEvent.click(roleSelect)
    
    await waitFor(() => {
      const orgAdminOption = screen.getByText('Org Admin')
      fireEvent.click(orgAdminOption)
    })
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Organization name is required for Org Admin')
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should toggle password visibility', () => {
    render(<RegisterPage />)
    
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
    const toggleButton = passwordInput.parentElement?.querySelector('button')
    
    expect(passwordInput.type).toBe('password')
    
    if (toggleButton) {
      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe('text')
      
      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    }
  })
})

describe('RegisterPage - Successful Registration Flow', () => {
  const mockPush = vi.fn()
  const mockRegister = vi.fn()
  const mockVerifyOtp = vi.fn()
  const mockResendOtp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(useAuth as any).mockReturnValue({
      register: mockRegister,
      verifyOtp: mockVerifyOtp,
      resendOtp: mockResendOtp,
    })
  })

  it('should submit registration with valid data for student', async () => {
    const { toast } = await import('sonner')
    mockRegister.mockResolvedValue({ success: true, requiresOTP: true })
    
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'student',
        organization_code: 'ABC123',
      })
    })
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Verification code sent to your email')
    })
  })

  it('should redirect to login if OTP not required', async () => {
    const { toast } = await import('sonner')
    mockRegister.mockResolvedValue({ success: true, requiresOTP: false })
    
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Account created! Please login.')
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should show OTP verification step when required', async () => {
    mockRegister.mockResolvedValue({ success: true, requiresOTP: true })
    
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    })
  })

  it('should verify OTP and redirect to dashboard', async () => {
    const { toast } = await import('sonner')
    mockRegister.mockResolvedValue({ success: true, requiresOTP: true })
    mockVerifyOtp.mockResolvedValue({
      success: true,
      redirectUrl: '/student/dashboard',
      data: {},
    })
    
    render(<RegisterPage />)
    
    // First, complete registration
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    // Wait for OTP screen
    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    })
    
    // Enter OTP
    const otpInputs = screen.getAllByRole('textbox')
    otpInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index) } })
    })
    
    const verifyButton = screen.getByRole('button', { name: /verify account/i })
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith('john@example.com', '012345')
      expect(toast.success).toHaveBeenCalledWith('Registration successful!')
      expect(mockPush).toHaveBeenCalledWith('/student/dashboard')
    })
  })
})

describe('RegisterPage - Error Handling', () => {
  const mockPush = vi.fn()
  const mockRegister = vi.fn()
  const mockVerifyOtp = vi.fn()
  const mockResendOtp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(useAuth as any).mockReturnValue({
      register: mockRegister,
      verifyOtp: mockVerifyOtp,
      resendOtp: mockResendOtp,
    })
  })

  it('should handle registration error - invalid organization code', async () => {
    const { toast } = await import('sonner')
    mockRegister.mockResolvedValue({
      success: false,
      error: 'Invalid organization code',
    })
    
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'INVALID' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid organization code')
    })
  })

  it('should handle registration error - email already exists', async () => {
    const { toast } = await import('sonner')
    mockRegister.mockResolvedValue({
      success: false,
      error: 'Email already registered',
    })
    
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already registered. Redirecting to login...')
    })
    
    // Should redirect to login after 2 seconds
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    }, { timeout: 3000 })
  })

  it('should handle OTP verification error', async () => {
    const { toast } = await import('sonner')
    mockRegister.mockResolvedValue({ success: true, requiresOTP: true })
    mockVerifyOtp.mockResolvedValue({
      success: false,
      error: 'Invalid OTP code',
    })
    
    render(<RegisterPage />)
    
    // Complete registration
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    // Wait for OTP screen
    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    })
    
    // Enter invalid OTP
    const otpInputs = screen.getAllByRole('textbox')
    otpInputs.forEach((input) => {
      fireEvent.change(input, { target: { value: '9' } })
    })
    
    const verifyButton = screen.getByRole('button', { name: /verify account/i })
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid OTP code')
    })
  })

  it('should handle resend OTP', async () => {
    const { toast } = await import('sonner')
    mockRegister.mockResolvedValue({ success: true, requiresOTP: true })
    mockResendOtp.mockResolvedValue({ success: true })
    
    render(<RegisterPage />)
    
    // Complete registration
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    // Wait for OTP screen
    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument()
    })
    
    // Click resend button (need to wait for timer to expire or find the button)
    const resendButton = screen.getByText(/didn't receive a code/i)
    fireEvent.click(resendButton)
    
    await waitFor(() => {
      expect(mockResendOtp).toHaveBeenCalledWith('john@example.com')
      expect(toast.success).toHaveBeenCalledWith('New verification code sent')
    })
  })

  it('should disable submit button while loading', async () => {
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true, requiresOTP: true }), 1000)))
    
    render(<RegisterPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const orgCodeInput = screen.getByLabelText(/organization code/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(orgCodeInput, { target: { value: 'ABC123' } })
    
    fireEvent.click(submitButton)
    
    // Button should be disabled while loading
    expect(submitButton).toBeDisabled()
  })
})
