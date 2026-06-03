import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, Clock, CheckCircle, AlertCircle, Heart, MessageCircle, Headphones, FileText, Building2, Users, Award, Shield, Coffee } from 'lucide-react';
import Navbar from './landing/components/Navbar';
import Footer from './landing/components/Footer';

const ContactUsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: <MapPin size={24} />, title: 'Main Headquarters', details: ['Ethiopian Red Cross Society', 'Mexico Square, Near Ministry of Health', 'P.O. Box 195', 'Addis Ababa, Ethiopia'] },
    { icon: <Building2 size={24} />, title: 'Addis Ababa Branch', details: ['Ethiopian Red Cross Society', 'Kazanchis, Behind UNECA', 'Addis Ababa, Ethiopia'] },
    { icon: <Phone size={24} />, title: 'Contact Numbers', details: ['+251 11 551 0022', '+251 11 551 0033', 'Emergency: +251 91 123 4567'] },
    { icon: <Mail size={24} />, title: 'Email Addresses', details: ['info@redcrosseth.org.et', 'donation@redcrosseth.org.et', 'support@sewlesew.com'] },
    { icon: <Clock size={24} />, title: 'Office Hours', details: ['Mon-Thu: 8:30 AM - 5:30 PM', 'Friday: 8:30 AM - 1:00 PM', 'Saturday: 9:00 AM - 1:00 PM', 'Sunday: Closed'] },
  ];

  const emergencyContacts = [
    { name: 'Emergency Blood Request', number: '+251 91 123 4567', icon: <Heart size={18} /> },
    { name: 'Red Cross Helpline', number: '+251 11 551 0022', icon: <Headphones size={18} /> },
  ];

  const developers = [
    { name: 'Feyruza Dawud', role: 'Backend Developer', email: 'feyruza.dawud-ug@aau.edu.et', github: 'https://github.com/precious161' },
    { name: 'Hanan Mohammed', role: 'Frontend Developer', email: 'hanan.mohammed@aau.edu.et', github: 'https://github.com/Hanan-3450' },
    { name: 'Hawi Yasin', role: 'UI/UX Designer', email: 'hawi.yasin@aau.edu.et', github: 'https://github.com/hawiyasin' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0f172a]">
      <Navbar />
      <main className="flex-1 pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center px-6 max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-medical-red/10 px-4 py-2 rounded-full mb-6">
            <MessageCircle size={16} className="text-medical-red" />
            <span className="text-[10px] font-black uppercase text-medical-red">Get in Touch</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[#111C44] dark:text-white tracking-tighter mb-6">
            We'd Love to<span className="text-medical-red italic block">Hear From You</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-2xl mx-auto">
            Have questions about donations or need urgent assistance? Reach out to the Ethiopian Red Cross Society.
          </p>
        </div>

        {/* Emergency Banner */}
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
                <Heart className="text-white" size={24} fill="white" />
              </div>
              <div>
                <p className="font-black text-red-500 text-lg uppercase">24/7 Emergency Blood Requests</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Call our helpline for immediate assistance</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {emergencyContacts.map((contact, idx) => (
                <a key={idx} href={`tel:${contact.number.replace(/\s/g, '')}`} className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-600 transition-all">
                  {contact.icon}{contact.number}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactInfo.map((info, idx) => (
              <div key={idx} className="bg-white dark:bg-[#111C44] rounded-2xl p-6 shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 bg-medical-red/10 rounded-xl flex items-center justify-center text-medical-red mb-4">{info.icon}</div>
                <h3 className="text-lg font-black text-[#111C44] dark:text-white mb-3">{info.title}</h3>
                {info.details.map((detail, i) => <p key={i} className="text-gray-500 dark:text-gray-400 text-sm mb-1">{detail}</p>)}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <div className="bg-white dark:bg-[#111C44] rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-black text-[#111C44] dark:text-white mb-2">Send Us a Message</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">We'll get back to you within 24 hours</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Your Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-[#111C44] dark:text-white focus:border-medical-red focus:outline-none" placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-[#111C44] dark:text-white focus:border-medical-red focus:outline-none" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Subject</label>
                <select name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-[#111C44] dark:text-white focus:border-medical-red focus:outline-none">
                  <option value="">Select a subject</option>
                  <option value="Donation Inquiry">Donation Inquiry</option>
                  <option value="Partnership">Partnership Opportunity</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Message</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-[#111C44] dark:text-white focus:border-medical-red focus:outline-none resize-none" placeholder="Tell us how we can help..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-medical-red text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? 'Sending...' : <>Send Message <Send size={16} /></>}
              </button>
              {submitStatus === 'success' && <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"><CheckCircle size={18} className="text-green-500" /><p className="text-green-600 text-sm">Message sent successfully!</p></div>}
              {submitStatus === 'error' && <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"><AlertCircle size={18} className="text-red-500" /><p className="text-red-600 text-sm">Failed to send. Please try again.</p></div>}
            </form>
          </div>
        </div>

        {/* Map Section */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="bg-white dark:bg-[#111C44] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-black text-[#111C44] dark:text-white">Find Us on Map</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ethiopian Red Cross Society - Mexico Square Headquarters</p>
            </div>
            <div className="h-64 w-full">
              <iframe title="Red Cross Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.5!2d38.7636!3d9.03!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85f2e6d1c3b5%3A0x7e8b2f8e9a1c6d4a!2sEthiopian%20Red%20Cross%20Society!5e0!3m2!1sen!2set!4v1700000000000!5m2!1sen!2set" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
            </div>
          </div>
        </div>

        {/* Developers Section */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-medical-red/10 px-4 py-2 rounded-full mb-6">
              <Users size={16} className="text-medical-red" />
              <span className="text-[10px] font-black uppercase text-medical-red">Project Team</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#111C44] dark:text-white uppercase italic mb-4">Meet The Developers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {developers.map((dev, idx) => (
              <div key={idx} className="bg-white dark:bg-[#111C44] rounded-2xl p-8 shadow-xl hover:-translate-y-2 transition-all duration-300 text-center group">
                <div className="w-20 h-20 bg-medical-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-medical-red text-2xl font-black group-hover:scale-110 transition-transform">
                  {idx === 0 ? 'F' : idx === 1 ? 'H' : 'H'}
                </div>
                <h3 className="text-xl font-black text-[#111C44] dark:text-white">{dev.name}</h3>
                <p className="text-medical-red text-xs font-black uppercase tracking-wider mb-3">{dev.role}</p>
                <a href={`mailto:${dev.email}`} className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-medical-red"><Mail size={14} /> {dev.email}</a>
                <a href={dev.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-medical-red mt-2">GitHub</a>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-[#111C44] to-[#1a2a5a] rounded-2xl p-8 text-center shadow-xl">
            <Heart size={32} className="text-medical-red mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">Sew Le Sew</h3>
            <p className="text-white/60 text-xs font-black uppercase tracking-wider">A Unified Donation Platform for Ethiopia</p>
            <div className="pt-6 border-t border-white/10 mt-4">
              <p className="text-white/40 text-[8px] font-black uppercase tracking-wider">© 2026 Sew Le Sew. All rights reserved.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUsPage;