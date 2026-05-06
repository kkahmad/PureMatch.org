// Hero Contact Form Handler
document.getElementById('heroContactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const reason = e.target.querySelector('select').value;
    
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
            body: JSON.stringify({ name, email, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Thank you! Your free consultation request has been submitted. We will contact you within 24 hours.');
            e.target.reset();
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
            body: JSON.stringify({ name, email, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Thank you! Your free consultation request has been submitted. We will contact you within 24 hours.');
            document.getElementById('consultationForm').reset();
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