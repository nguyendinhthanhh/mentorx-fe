# Discovery Feed Design - Netflix-Style Dashboard

## 🎯 Concept

Dashboard của User không phải là **stats dashboard** mà là **Discovery Feed** - một cỗ máy bán hàng và giữ chân người dùng như Netflix, Udemy, Spotify.

---

## 🧠 Matching Engine Integration

Tất cả nội dung được **personalized** dựa trên:

### **User Interest Profile**
- Skills & Interests (Java, UI/UX, React...)
- Skill Level (Beginner, Intermediate, Advanced)
- Learning Goals
- Budget range
- Preferred learning style

### **Matching Score**
Mỗi item có **Match Score** (85-96%) hiển thị rõ ràng:
- ⚡ 95% Match - Highly recommended
- ⚡ 90% Match - Great fit
- ⚡ 85% Match - Good match

---

## 📐 Feed Structure

### **1. Welcome Banner**
```
┌─────────────────────────────────────────────────────────┐
│  Discover Your Path, John! 🚀                           │
│  Personalized recommendations based on your interests   │
└─────────────────────────────────────────────────────────┘
```

**Purpose:** Personalized greeting, set the tone

---

### **2. Top Mentors Slider** ⭐ PRIORITY #1

```
┌─────────────────────────────────────────────────────────┐
│  Top Mentors For You                          [< >]     │
│  Matched based on your interests and skill level        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ ⚡95% Match│  │ ⚡92% Match│  │ ⚡88% Match│             │
│  │ [Avatar] │  │ [Avatar] │  │ [Avatar] │             │
│  │ John Doe │  │ Sarah C. │  │ Mike J.  │             │
│  │ Java Dev │  │ UI/UX    │  │ Full St. │             │
│  │ ⭐4.9(127)│  │ ⭐4.8(89) │  │ ⭐4.7(156)│             │
│  │ $50/hr   │  │ $45/hr   │  │ $55/hr   │             │
│  │ [Tags]   │  │ [Tags]   │  │ [Tags]   │             │
│  │ 🟢 Avail │  │ 🟢 Avail │  │ 🟡 Tmrw  │             │
│  │ [View]   │  │ [View]   │  │ [View]   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ⚡ Match Score badge (prominent)
- ❤️ Save/Favorite button
- ⭐ Rating + reviews
- 💰 Hourly rate
- 🏷️ Top 3 tags
- 🟢 Availability status
- 👁️ View Profile CTA

**Matching Logic:**
- User chọn "Java Beginner" → Show Java mentors với tag "Teaching Beginners"
- User chọn "UI/UX Advanced" → Show senior UI/UX mentors
- Sort by: Match Score → Rating → Availability

---

### **3. Knowledge Feed** 📰 PRIORITY #2

```
┌─────────────────────────────────────────────────────────┐
│  Knowledge Feed                            [View All]   │
│  Articles and insights tailored to your learning path   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │[Thumb]   │  │[Thumb]   │  │[Thumb]   │             │
│  │⚡96% 5min│  │⚡93% 8min│  │⚡89% 10min│             │
│  │Lộ trình  │  │10 nguyên │  │Tối ưu   │             │
│  │học Java  │  │tắc UI/UX │  │React App │             │
│  │[Tags]    │  │[Tags]    │  │[Tags]    │             │
│  │[Author]  │  │[Author]  │  │[Author]  │             │
│  │❤️234 💬45│  │❤️567 💬89│  │❤️432 💬67│             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ⚡ Match Score + Read time
- 🖼️ Thumbnail (gradient placeholder)
- 📝 Title + Excerpt
- 🏷️ Tags
- 👤 Author info
- ❤️ Likes + 💬 Comments

**Matching Logic:**
- User "Java Beginner" → "Lộ trình học Java cho người mới"
- User "UI/UX Intermediate" → "Advanced UI patterns"
- Filter by: Skill level, interests, trending

---

### **4. Courses You'll Love** 📚 PRIORITY #3

```
┌─────────────────────────────────────────────────────────┐
│  Courses You'll Love                    [Browse All]    │
│  Best-selling courses matched to your skill level       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │[Thumb]   │  │[Thumb]   │  │[Thumb]   │             │
│  │⚡94% Beg │  │⚡91% Beg │  │⚡87% Int │             │
│  │Java Boot │  │UI/UX Fun │  │React Full│             │
│  │by John   │  │by Sarah  │  │by Mike   │             │
│  │⭐4.8     │  │⭐4.9     │  │⭐4.7     │             │
│  │👥1,234   │  │👥2,341   │  │👥987     │             │
│  │⏱️12hrs   │  │⏱️8hrs    │  │⏱️16hrs   │             │
│  │$49.99    │  │$39.99    │  │$59.99    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ⚡ Match Score + Level badge
- 🖼️ Course thumbnail
- 📝 Title + Instructor
- ⭐ Rating
- 👥 Students enrolled
- ⏱️ Duration
- 💰 Price

**Matching Logic:**
- User "Beginner" → Show "Beginner" courses
- User interested in "Java" → Show Java courses
- Sort by: Match Score → Best-selling → Rating

---

### **5. Quick Support Requests** 💼 PRIORITY #4

```
┌─────────────────────────────────────────────────────────┐
│  Quick Support Requests                [View All Jobs]  │
│  Help others and earn while learning                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │💼 $50    │  │💼 $30    │  │💼 $40    │             │
│  │⏱️2 days  │  │⏱️1 day   │  │⏱️3 days  │             │
│  │Review    │  │Debug Java│  │Code Rev  │             │
│  │Portfolio │  │Spring Err│  │React Comp│             │
│  │[Tags]    │  │[Tags]    │  │[Tags]    │             │
│  │3 applic. │  │5 applic. │  │2 applic. │             │
│  │[Apply]   │  │[Apply]   │  │[Apply]   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- 💰 Budget (prominent)
- ⏱️ Deadline
- 📝 Title + Description
- 🏷️ Tags
- 👥 Applicants count
- 📤 Apply CTA

**Matching Logic:**
- Show jobs related to user's skills
- Filter by budget range
- Show "learning opportunities" (easier jobs for beginners)

---

## 🎨 Design Principles

### **1. Match Score Everywhere**
```tsx
<div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-black">
  <Zap className="w-3 h-3" />
  95% Match
</div>
```

**Why:** Build trust, show personalization works

---

### **2. Visual Hierarchy**
1. **Match Score** - Most prominent (green badge)
2. **Title/Name** - Bold, large
3. **Key Stats** - Rating, price, students
4. **Tags** - Secondary info
5. **CTA** - Clear action button

---

### **3. Card Design**
- **Hover effects** - Border color change, scale
- **Consistent spacing** - 6px gaps, 6px padding
- **Rounded corners** - 2xl (16px)
- **Shadows** - Subtle, increase on hover
- **Dark mode** - Full support

---

### **4. Slider Pattern**
```tsx
const [slideIndex, setSlideIndex] = useState(0)
const visibleItems = 3
const maxSlideIndex = Math.max(0, items.length - visibleItems)

<div className="flex gap-6 transition-transform duration-500"
     style={{ transform: `translateX(-${slideIndex * 34}%)` }}>
  {items.map(item => <Card />)}
</div>
```

**Why:** Show multiple items, encourage exploration

---

## 🔄 Data Flow

### **Frontend → Backend**

```typescript
// Get personalized recommendations
GET /api/v1/matching/recommendations
Headers: Authorization: Bearer {token}

Response:
{
  mentors: [
    {
      id: 1,
      name: "John Doe",
      matchScore: 95,
      rating: 4.9,
      ...
    }
  ],
  courses: [...],
  posts: [...],
  jobs: [...]
}
```

### **Matching Engine Logic**

```java
// Backend calculates match scores
public class MatchingService {
  
  public List<MentorRecommendation> getRecommendedMentors(User user) {
    UserInterestProfile profile = getProfile(user);
    
    return mentorRepository.findAll()
      .stream()
      .map(mentor -> {
        double score = calculateMatchScore(profile, mentor);
        return new MentorRecommendation(mentor, score);
      })
      .filter(rec -> rec.getScore() >= 80) // Minimum 80% match
      .sorted(Comparator.comparing(MentorRecommendation::getScore).reversed())
      .limit(10)
      .collect(Collectors.toList());
  }
  
  private double calculateMatchScore(UserInterestProfile profile, Mentor mentor) {
    double skillMatch = calculateSkillMatch(profile.getSkills(), mentor.getSkills());
    double levelMatch = calculateLevelMatch(profile.getLevel(), mentor.getTeachingLevels());
    double ratingBonus = mentor.getRating() / 5.0 * 10; // Max 10% bonus
    
    return (skillMatch * 0.6) + (levelMatch * 0.3) + (ratingBonus * 0.1);
  }
}
```

---

## 📊 Metrics to Track

### **Engagement Metrics**
- Click-through rate on recommendations
- Time spent on feed
- Items saved/favorited
- Scroll depth

### **Conversion Metrics**
- Mentor profile views → Hire
- Course views → Enroll
- Job views → Apply
- Post views → Read full

### **Personalization Metrics**
- Match score accuracy
- User satisfaction with recommendations
- Diversity of recommendations
- Freshness of content

---

## 🚀 Implementation Phases

### **Phase 1: Mock Data (Current)**
- ✅ UI components
- ✅ Slider functionality
- ✅ Card designs
- ✅ Match score badges
- ✅ Responsive layout

### **Phase 2: API Integration**
- [ ] Connect to Matching Engine API
- [ ] Fetch personalized recommendations
- [ ] Real-time match score calculation
- [ ] Loading states
- [ ] Error handling

### **Phase 3: Advanced Features**
- [ ] Infinite scroll
- [ ] Real-time updates
- [ ] Save/favorite functionality
- [ ] Filter & sort options
- [ ] A/B testing different layouts

### **Phase 4: Optimization**
- [ ] Caching strategies
- [ ] Lazy loading images
- [ ] Prefetching data
- [ ] Performance monitoring
- [ ] Analytics integration

---

## 💡 Future Enhancements

### **1. Smart Notifications**
```
"New mentor matching 98% with your profile!"
"Course you saved is now 50% off"
"3 new jobs matching your skills"
```

### **2. Learning Path**
```
Your Journey: Java Beginner → Intermediate
Next Steps:
1. Complete "Java Basics" course (50% done)
2. Practice with 3 coding challenges
3. Book session with Java mentor
```

### **3. Social Proof**
```
"127 people like you hired John Doe"
"This course helped 89% of beginners land jobs"
"Trending in your network: React Hooks"
```

### **4. Gamification**
```
🏆 Complete 3 courses → Unlock "Learner" badge
⭐ Get 5-star review → Unlock "Helper" badge
🔥 7-day streak → Unlock "Consistent" badge
```

---

## 🎯 Success Criteria

### **User Engagement**
- ✅ 80%+ users click on at least 1 recommendation
- ✅ Average 5+ minutes on feed
- ✅ 30%+ return daily

### **Conversion**
- ✅ 15%+ mentor profile views → Hire
- ✅ 20%+ course views → Enroll
- ✅ 10%+ job views → Apply

### **Satisfaction**
- ✅ 4.5+ star rating for recommendations
- ✅ 80%+ find recommendations relevant
- ✅ 70%+ prefer feed over browse

---

## 📝 Notes

- **Discovery Feed** is the **default dashboard** for users
- Old stats dashboard moved to `/profile/stats` (optional)
- Feed updates every time user updates interests
- Match scores recalculated daily
- Content refreshes every 6 hours

---

**This is the heart of MentorX - the personalization engine that keeps users engaged and converts them into customers!** 🚀
