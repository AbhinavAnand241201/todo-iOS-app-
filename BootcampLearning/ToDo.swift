//
//  ToDo.swift
//  BootcampLearning
//
//  Created by ABHINAV ANAND  on 31/01/25.
//

import Foundation

struct ToDo: Identifiable, Codable {
    var id = UUID()          // Unique identifier for each todo
    var title: String        // The title/description of the todo
    var isCompleted: Bool = false  // Tracks whether the todo is completed or not, default is false
}
