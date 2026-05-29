import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'agendaris@pdam.go.id' }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const valid = await bcrypt.compare('Agendaris@12345', user.passwordHash);
    
    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, isActive: user.isActive },
      passwordValid: valid
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
