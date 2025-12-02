export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
    let score = 0;
    let feedback = [];
  
    if (password.length >= minLength) score++;
    else feedback.push('at least 8 characters');
  
    if (hasUpperCase) score++;
    else feedback.push('uppercase letter');
  
    if (hasLowerCase) score++;
    else feedback.push('lowercase letter');
  
    if (hasNumbers) score++;
    else feedback.push('number');
  
    if (hasSpecialChar) score++;
    else feedback.push('special character');
  
    const isValid = score >= 4;
    const feedbackMessage = feedback.length > 0
      ? `Password needs: ${feedback.join(', ')}`
      : 'Password strength: Strong';
  
    return {
      isValid,
      score,
      feedback: feedbackMessage
    };
  };
  
 