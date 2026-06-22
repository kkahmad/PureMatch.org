// Hero Contact Form Handler
document.getElementById('heroContactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = e.target.querySelector('input[name="name"]').value;
    const email = e.target.querySelector('input[name="email"]').value;
    const phone = e.target.querySelector('input[name="phone"]').value;
    const reason = e.target.querySelector('select[name="reason"]').value;
    
    const submitBtn = e.target.querySelector('.form-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/submit-consultation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const successMsg = document.getElementById('heroSuccessMessage');
            successMsg.style.display = 'flex';
            e.target.reset();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 5000);
        } else {
            alert('Something went wrong. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please check your connection and try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Main Consultation Form Handler
document.getElementById('consultationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const reason = document.getElementById('reason').value;
    const phone = document.querySelector('input[name="phone"]')?.value || '';
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/submit-consultation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, reason, phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const successMsg = document.getElementById('consultationSuccessMessage');
            successMsg.style.display = 'flex';
            document.getElementById('consultationForm').reset();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 5000);
        } else {
            alert('Something went wrong. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please check your connection and try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});// JavaScript Document

// WhatsApp popup behavior — initialize after DOM ready so elements exist
document.addEventListener('DOMContentLoaded', () => {
    const whatsappFab = document.getElementById('whatsappFab');
    const whatsappPopup = document.getElementById('whatsappPopup');
    const whatsappClose = document.getElementById('whatsappClose');
    const whatsappStart = document.getElementById('whatsappStart');
    const WHATSAPP_NUMBER = '+17737339216';
    const GREETING = "Assalamu alaikum, this is Rashid from Islamic Rishta App. How can I help you today?";

    function openWhatsAppChat() {
        const text = encodeURIComponent(GREETING);
        const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${text}`;
        window.open(url, '_blank');
    }

    if (whatsappFab && whatsappPopup) {
        whatsappFab.addEventListener('click', () => {
            if (whatsappPopup.classList.contains('open')) {
                whatsappPopup.classList.remove('open');
                whatsappPopup.style.display = 'none';
            } else {
                whatsappPopup.classList.add('open');
                whatsappPopup.style.display = 'block';
            }
        });
    }

    if (whatsappClose && whatsappPopup) {
        whatsappClose.addEventListener('click', () => {
            whatsappPopup.classList.remove('open');
            whatsappPopup.style.display = 'none';
        });
    }

    if (whatsappStart) {
        whatsappStart.addEventListener('click', () => openWhatsAppChat());
    }
});